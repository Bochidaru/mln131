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
    private Task? _tickTask;
    private long _tickCounter = 0;
    private readonly int _tickRate;

    public GameRoom(ILogger<GameRoom> logger, string id, int TickRate)
    {
        _logger = logger;
        Id = id;
        _tickRate = TickRate;
    }

    public int PlayerCount => _players.Count;

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
        foreach (var client in _players.Values)
        {
            var source = client.State;
            playersState.Add(new PlayerState
            {
                PlayerId = source.PlayerId,
                Name = source.Name,
                AvatarId = source.AvatarId,
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
        }
    }

    private void ApplyPose(ClientConnection connection, JsonElement payload)
    {
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
        connection.State.TickId = _tickCounter;
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
