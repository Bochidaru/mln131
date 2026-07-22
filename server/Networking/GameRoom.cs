using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using server.Models;
using server.Protocol;

namespace server.Networking;

public sealed class GameRoom
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    public string Id { get; }
    private readonly ConcurrentDictionary<string, ClientConnection> _players = new();
    private readonly object _playerGate = new();
    private readonly CancellationTokenSource _cts = new();
    private readonly ILogger<GameRoom> _logger;
    private readonly DuelManager _duels;
    private Task? _tickTask;
    private long _tickCounter = 0;
    private readonly int _tickRate;

    public GameRoom(ILogger<GameRoom> logger, DuelManager duels, string id, int TickRate)
    {
        _logger = logger; _duels = duels;
        Id = id;
        _tickRate = TickRate;
    }

    public int PlayerCount => _players.Count;
    public IReadOnlyList<PlayerAdminSnapshot> GetAdminPlayers() => _players.Values
        .Select(player => new PlayerAdminSnapshot(player.Id, player.State.Name, player.State.AvatarId, player.State.Score, player.State.Area, _duels.IsInDuel(player.Id)))
        .OrderByDescending(player => player.Score)
        .ThenBy(player => player.Name, StringComparer.OrdinalIgnoreCase)
        .ToArray();

    public bool TryJoin(ClientConnection playerConnection, JsonElement? payload, out string rejectionReason)
    {
        rejectionReason = string.Empty;
        if (payload is not JsonElement profile || !profile.TryGetProperty("name", out var nameElement) || nameElement.ValueKind != JsonValueKind.String)
        {
            rejectionReason = "Tên hiển thị không hợp lệ.";
            return false;
        }

        var name = string.Join(' ', (nameElement.GetString() ?? string.Empty).Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries));
        if (name.Length is < 1 or > 24)
        {
            rejectionReason = "Tên cần có từ 1 đến 24 ký tự.";
            return false;
        }

        var avatarId = profile.TryGetProperty("avatarId", out var avatarElement) && avatarElement.ValueKind == JsonValueKind.String
            ? avatarElement.GetString() ?? "block-explorer"
            : "block-explorer";
        var allowedAvatars = new HashSet<string>(StringComparer.Ordinal)
        {
            "block-explorer", "forest-scout", "mushroom-captain", "neon-ninja", "space-marshal",
            "rubber-duck", "banana-agent", "capybara-king", "pixel-knight", "robo-gecko"
        };
        if (!allowedAvatars.Contains(avatarId)) avatarId = "block-explorer";

        lock (_playerGate)
        {
            if (_players.Count >= 100)
            {
                rejectionReason = "Phòng đã đủ 100 người. Hãy thử lại sau.";
                return false;
            }

            if (_players.Values.Any(player => string.Equals(player.State.Name, name, StringComparison.OrdinalIgnoreCase)))
            {
                rejectionReason = "Tên này đã có người dùng trong bảo tàng. Hãy chọn tên khác.";
                return false;
            }

            playerConnection.State.Name = name;
            playerConnection.State.AvatarId = avatarId;
            _players[playerConnection.Id] = playerConnection;
        }
        return true;
    }

    public async Task AddPlayer(ClientConnection playerConnection, CancellationToken cancellationToken)
    {
        playerConnection.State.PlayerId = playerConnection.Id;
        playerConnection.State.TickId = _tickCounter;

        await SendAsync(playerConnection, new ServerMessage("welcome", playerConnection.Id, new
        {
            roomId = Id,
            tickRate = _tickRate,
            online = PlayerCount,
            score = playerConnection.State.Score,
            players = CreateSnapshot().Players
        }), cancellationToken);

        _ = BroadcastMessageAsync(new ServerMessage("playerJoined", playerConnection.Id, new
        {
            online = PlayerCount,
            player = playerConnection.State
        }), exceptPlayerId: playerConnection.Id, CancellationToken.None);

        _logger.LogInformation("Player {PlayerId} connected", playerConnection.Id);

        try
        {
            await ReceiveLoopAsync(playerConnection, cancellationToken);
        }
        finally
        {
            RemovePlayer(playerConnection);
        }
    }

    public void RemovePlayer(ClientConnection playerConnection)
    {
        _duels.PlayerLeft(playerConnection.Id);
        lock (_playerGate)
        {
            if (_players.TryRemove(playerConnection.Id, out _))
            {
                var leaveMessage = new ServerMessage("playerLeft", playerConnection.Id, new { online = PlayerCount });

                _ = BroadcastMessageAsync(leaveMessage, exceptPlayerId: playerConnection.Id, CancellationToken.None);
                _logger.LogInformation("Player {PlayerId} disconnected", playerConnection.Id);
            }
        }
    }

    public async Task<bool> KickPlayerAsync(string playerId, CancellationToken cancellationToken)
    {
        if (!_players.TryGetValue(playerId, out var player)) return false;

        var name = player.State.Name;
        RemovePlayer(player);
        await BroadcastMessageAsync(new ServerMessage("chat", "system", new
        {
            name = "Hệ thống",
            text = $"Người chơi {name} đã bị kick bởi admin"
        }), exceptPlayerId: null, cancellationToken);

        try
        {
            if (player.Socket.State == WebSocketState.Open)
            {
                await player.Socket.CloseOutputAsync(WebSocketCloseStatus.PolicyViolation, "Kicked by admin", cancellationToken);
            }
        }
        catch (WebSocketException) { }
        catch (OperationCanceledException) { }

        return true;
    }

    public void Start()
    {
        _tickTask = Task.Run(() => TickLoopAsync(_cts.Token));
    }

    public void Stop()
    {
        _cts.Cancel();
        _tickTask?.Wait();
    }

    private async Task TickLoopAsync(CancellationToken token)
    {
        var tickRate = TimeSpan.FromMilliseconds(1000.0/_tickRate);
        while (!token.IsCancellationRequested)
        {
            _tickCounter++;

            // chỉ broadcast nếu có nhiều hơn 1 player
            if (_players.Count > 1)
            {
                await BroadcastWorldStateAsync(CreateSnapshot(), token);
            }

            await Task.Delay(tickRate, token);
        }
    }

    private WorldState CreateSnapshot()
    {
        var playersState = new List<PlayerState>(_players.Count);
        foreach (var client in _players.Values.Where(client => !_duels.IsInDuel(client.Id)))
        {
            var source = client.State;
            playersState.Add(new PlayerState
            {
                PlayerId = source.PlayerId,
                Name = source.Name,
                AvatarId = source.AvatarId,
                Pose = source.Pose,
                Score = source.Score,
                X = source.X,
                Y = source.Y,
                Z = source.Z,
                DirX = source.DirX,
                DirZ = source.DirZ,
                Area = source.Area,
                FocusedPoster = source.FocusedPoster,
                Seated = source.Seated,
                Jumping = source.Jumping,
                Sprinting = source.Sprinting,
                TickId = source.TickId
            });
        }

        return new WorldState
        {
            TickId = _tickCounter,
            DoorOpen = playersState.Any(player => Math.Abs(player.X) < 3.8f && Math.Abs(player.Z - 9.3f) < 4f),
            Players = playersState
        };
    }

    private async Task BroadcastWorldStateAsync(WorldState snapshot, CancellationToken token)
    {
        var json = JsonSerializer.Serialize(snapshot, JsonOptions);
        var buffer = Encoding.UTF8.GetBytes(json);

        foreach (var client in _players.Values)
        {
            await client.SendLock.WaitAsync(token);
            try
            {
                if (client.Socket.State == WebSocketState.Open)
                {
                    await client.Socket.SendAsync(buffer, WebSocketMessageType.Text, true, token);
                }
            }
            finally
            {
                client.SendLock.Release();
            }
        }
    }

    private async Task BroadcastMessageAsync(ServerMessage message, string? exceptPlayerId, CancellationToken cancellationToken)
    {
        var sends = new List<Task>();

        foreach (var client in _players.Values)
        {
            if (client.Id != exceptPlayerId && client.Socket.State == WebSocketState.Open)
            {
                sends.Add(SendAsync(client, message, cancellationToken));
            }
        }

        await Task.WhenAll(sends);
    }

    private static async Task SendAsync(ClientConnection connection, ServerMessage message, CancellationToken cancellationToken)
    {
        var json = JsonSerializer.Serialize(message, JsonOptions);
        var payload = Encoding.UTF8.GetBytes(json);

        await connection.SendLock.WaitAsync(cancellationToken);
        try
        {
            if (connection.Socket.State == WebSocketState.Open)
            {
                await connection.Socket.SendAsync(payload, WebSocketMessageType.Text, true, cancellationToken);
            }
        }
        finally
        {
            connection.SendLock.Release();
        }
    }

    private async Task ReceiveLoopAsync(ClientConnection connection, CancellationToken cancellationToken)
    {
        while (connection.Socket.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
        {
            var rawMessage = await ReceiveTextAsync(connection.Socket, cancellationToken);
            if (rawMessage is null) break;

            ClientMessage? message;
            try
            {
                message = JsonSerializer.Deserialize<ClientMessage>(rawMessage, JsonOptions);
            }
            catch (JsonException)
            {
                continue;
            }

            if (message?.Type == "pose" && message.Payload is JsonElement payload)
            {
                ApplyPose(connection, payload);
            }
            else if (message?.Type == "chat" && message.Payload is JsonElement chatPayload)
            {
                BroadcastChat(connection, chatPayload);
            }
            else if (message?.Type == "quizReward" && message.Payload is JsonElement quizPayload)
            {
                AwardQuiz(connection, quizPayload);
            }
            else if (message?.Type == "pvpRequest" && message.Payload is JsonElement requestPayload && requestPayload.TryGetProperty("targetPlayerId", out var targetElement))
            {
                if (targetElement.GetString() is { } targetId && _players.TryGetValue(targetId, out var target)) _duels.Request(connection, target);
            }
            else if (message?.Type == "pvpResponse" && message.Payload is JsonElement responsePayload && responsePayload.TryGetProperty("fromPlayerId", out var fromElement))
            {
                var accepted = responsePayload.TryGetProperty("accepted", out var acceptedElement) && acceptedElement.GetBoolean();
                _duels.Respond(connection, fromElement.GetString() is { } fromId && _players.TryGetValue(fromId, out var requester) ? requester : null, accepted);
            }
            else if (message?.Type == "duelInput" && message.Payload is JsonElement inputPayload)
            {
                if (TryReadDuelVector(inputPayload, out var moveX, out var moveZ, out var dirX, out var dirZ, out var sprinting, out var jump, out var pose))
                {
                    _duels.Input(connection.Id, new DuelRoom.DuelInput(moveX, moveZ, dirX, dirZ, sprinting, jump, pose));
                }
            }
            else if (message?.Type == "duelShoot" && message.Payload is JsonElement shootPayload)
            {
                if (shootPayload.TryGetProperty("dirX", out var dirXElement) && dirXElement.TryGetSingle(out var dirX)
                    && shootPayload.TryGetProperty("dirZ", out var dirZElement) && dirZElement.TryGetSingle(out var dirZ))
                {
                    _duels.Shoot(connection.Id, dirX, dirZ);
                }
            }
            else if (message?.Type == "duelForfeit")
            {
                _duels.Forfeit(connection.Id);
            }
        }
    }

    private void ApplyPose(ClientConnection connection, JsonElement payload)
    {
        if (_duels.IsInDuel(connection.Id)) return;
        PlayerPoseMessage? pose;
        try
        {
            pose = payload.Deserialize<PlayerPoseMessage>(JsonOptions);
        }
        catch (JsonException)
        {
            return;
        }

        if (pose is null) return;

        connection.State.X = pose.X;
        connection.State.Y = pose.Y;
        connection.State.Z = pose.Z;
        connection.State.DirX = pose.DirX;
        connection.State.DirZ = pose.DirZ;
        connection.State.Area = string.IsNullOrWhiteSpace(pose.Area) ? "grounds" : pose.Area;
        connection.State.FocusedPoster = pose.FocusedPoster;
        connection.State.Seated = pose.Seated;
        connection.State.Pose = Math.Clamp(pose.Pose, 0, 2);
        connection.State.TickId = _tickCounter;
    }

    private static bool TryReadDuelVector(JsonElement payload, out float moveX, out float moveZ, out float dirX, out float dirZ, out bool sprinting, out bool jump, out int pose)
    {
        moveX = moveZ = dirX = dirZ = 0; sprinting = jump = false; pose = 0;
        if (payload.TryGetProperty("sprint", out var sprintElement)) sprinting = sprintElement.ValueKind == JsonValueKind.True || sprintElement.TryGetInt32(out var sprintValue) && sprintValue != 0;
        if (payload.TryGetProperty("jump", out var jumpElement)) jump = jumpElement.ValueKind == JsonValueKind.True || jumpElement.TryGetInt32(out var jumpValue) && jumpValue != 0;
        if (payload.TryGetProperty("pose", out var poseElement) && poseElement.TryGetInt32(out var poseValue)) pose = Math.Clamp(poseValue, 0, 2);
        return payload.TryGetProperty("moveX", out var moveXElement) && moveXElement.TryGetSingle(out moveX)
            && payload.TryGetProperty("moveZ", out var moveZElement) && moveZElement.TryGetSingle(out moveZ)
            && payload.TryGetProperty("dirX", out var dirXElement) && dirXElement.TryGetSingle(out dirX)
            && payload.TryGetProperty("dirZ", out var dirZElement) && dirZElement.TryGetSingle(out dirZ);
    }

    private void BroadcastChat(ClientConnection connection, JsonElement payload)
    {
        if (!payload.TryGetProperty("text", out var textElement) || textElement.ValueKind != JsonValueKind.String) return;
        var text = textElement.GetString()?.Trim();
        if (string.IsNullOrWhiteSpace(text)) return;
        if (text.Length > 280) text = text[..280];

        _ = BroadcastMessageAsync(new ServerMessage("chat", connection.Id, new
        {
            name = connection.State.Name,
            text
        }), exceptPlayerId: null, CancellationToken.None);
    }

    private void AwardQuiz(ClientConnection connection, JsonElement payload)
    {
        if (!payload.TryGetProperty("roomId", out var roomElement) || !roomElement.TryGetInt32(out var roomId)
            || !payload.TryGetProperty("correct", out var correctElement) || !correctElement.TryGetInt32(out var correct)) return;
        if (roomId is < 1 or > 8 || connection.State.Area != $"room-{roomId}") return;
        if (connection.QuizCooldowns.TryGetValue(roomId, out var availableAt) && availableAt > DateTimeOffset.UtcNow)
        {
            _ = SendAsync(connection, new ServerMessage("quizCooldown", Payload: new { quizRoomId = roomId, availableAt }), CancellationToken.None);
            return;
        }

        var clampedCorrect = Math.Clamp(correct, 0, 5);
        var earned = clampedCorrect * 2;
        var nextAvailableAt = DateTimeOffset.UtcNow.AddSeconds(30);
        connection.QuizCooldowns[roomId] = nextAvailableAt;
        connection.State.Score += earned;

        _ = SendAsync(connection, new ServerMessage("quizResult", Payload: new { quizRoomId = roomId, correct = clampedCorrect, earned, score = connection.State.Score, availableAt = nextAvailableAt }), CancellationToken.None);
        _ = BroadcastMessageAsync(new ServerMessage("playerUpdated", connection.Id, new { player = connection.State }), exceptPlayerId: connection.Id, CancellationToken.None);
    }

    private static async Task<string?> ReceiveTextAsync(WebSocket socket, CancellationToken cancellationToken)
    {
        var buffer = new byte[4096];
        using var stream = new MemoryStream();

        while (true)
        {
            var result = await socket.ReceiveAsync(buffer, cancellationToken);
            if (result.MessageType == WebSocketMessageType.Close)
            {
                if (socket.State == WebSocketState.CloseReceived)
                {
                    await socket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "Closing", cancellationToken);
                }

                return null;
            }

            if (result.MessageType != WebSocketMessageType.Text)
            {
                return null;
            }

            stream.Write(buffer, 0, result.Count);
            if (result.EndOfMessage)
            {
                return Encoding.UTF8.GetString(stream.ToArray());
            }
        }
    }

}

public sealed record PlayerAdminSnapshot(string Id, string Name, string AvatarId, int Score, string Area, bool InDuel);
