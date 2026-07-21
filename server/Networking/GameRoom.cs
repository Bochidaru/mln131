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

    public async Task AddPlayer(ClientConnection playerConnection, CancellationToken cancellationToken)
    {
        _players[playerConnection.Id] = playerConnection;
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
        if (_players.TryRemove(playerConnection.Id, out _))
        {
            var leaveMessage = new ServerMessage("playerLeft", playerConnection.Id, new { online = PlayerCount });

            _ = BroadcastMessageAsync(leaveMessage, exceptPlayerId: playerConnection.Id, CancellationToken.None);
            _logger.LogInformation("Player {PlayerId} disconnected", playerConnection.Id);
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
            else if (message?.Type == "profile" && message.Payload is JsonElement profilePayload)
            {
                UpdateProfile(connection, profilePayload);
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

    private void UpdateProfile(ClientConnection connection, JsonElement payload)
    {
        if (!payload.TryGetProperty("name", out var nameElement) || nameElement.ValueKind != JsonValueKind.String) return;

        var name = nameElement.GetString()?.Trim();
        if (string.IsNullOrWhiteSpace(name)) return;

        connection.State.Name = name.Length > 24 ? name[..24] : name;
        _ = BroadcastMessageAsync(new ServerMessage("playerUpdated", connection.Id, new
        {
            player = connection.State
        }), exceptPlayerId: connection.Id, CancellationToken.None);
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
