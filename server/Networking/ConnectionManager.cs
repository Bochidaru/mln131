using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using server.Protocol;
using server.Models;

namespace server.Networking;

public sealed class ConnectionManager
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly ConcurrentDictionary<string, ClientConnection> _clients = new();
    private readonly ConcurrentDictionary<string, GameRoom> _rooms = new();
    private readonly ILogger<ConnectionManager> _logger;

    public int RoomCount => _rooms.Count;
    public const int tickRate = 64;

    public ConnectionManager(ILogger<ConnectionManager> logger, GameRoomFactory factory)
    {
        _logger = logger;
        var defaultRoom = factory.Create("Room-1", tickRate);
        _rooms[defaultRoom.Id] = defaultRoom;
        defaultRoom.Start();
    }


    public async Task HandleAsync(WebSocket socket, CancellationToken cancellationToken)
    {
        var connection = new ClientConnection(Guid.NewGuid().ToString("N"), socket);
        _clients[connection.Id] = connection;

        _logger.LogInformation("Player {PlayerId} connected", connection.Id);

        var room = _rooms["Room-1"];
        
        try
        {
            await room.AddPlayer(connection, cancellationToken);
        }
        finally
        {
            _clients.TryRemove(connection.Id, out _);
            room.RemovePlayer(connection);
            _logger.LogInformation("Player {PlayerId} disconnected", connection.Id);
        }
    }
}


    // private async Task ReceiveLoopAsync(ClientConnection connection, CancellationToken cancellationToken)
    // {
    //     while (connection.Socket.State == WebSocketState.Open && !cancellationToken.IsCancellationRequested)
    //     {
    //         var rawMessage = await ReceiveTextAsync(connection.Socket, cancellationToken);
    //         if (rawMessage is null) break;

    //         PlayerInput? input;
    //         try
    //         {
    //             input = JsonSerializer.Deserialize<PlayerInput>(rawMessage, JsonOptions);
    //         }
    //         catch (JsonException)
    //         {
    //             continue;
    //         }

    //         if (input != null)
    //         {
    //             connection.InputQueue.Enqueue(input);
    //         }
    //     }
    // }

    // private static async Task<string?> ReceiveTextAsync(WebSocket socket, CancellationToken cancellationToken)
    // {
    //     var buffer = new byte[4096];
    //     using var stream = new MemoryStream();

    //     while (true)
    //     {
    //         var result = await socket.ReceiveAsync(buffer, cancellationToken);
    //         if (result.MessageType == WebSocketMessageType.Close)
    //         {
    //             if (socket.State == WebSocketState.CloseReceived)
    //             {
    //                 await socket.CloseOutputAsync(WebSocketCloseStatus.NormalClosure, "Closing", cancellationToken);
    //             }

    //             return null;
    //         }

    //         if (result.MessageType != WebSocketMessageType.Text)
    //         {
    //             return null;
    //         }

    //         stream.Write(buffer, 0, result.Count);
    //         if (result.EndOfMessage)
    //         {
    //             return Encoding.UTF8.GetString(stream.ToArray());
    //         }
    //     }
    // }

    // private Task RouteAsync(ClientConnection sender, ClientMessage message, CancellationToken cancellationToken)
    // {
    //     var serverMessage = new ServerMessage(message.Type, sender.Id, message.Payload);
    //     return BroadcastAsync(serverMessage, exceptPlayerId: sender.Id, cancellationToken);
    // }

    // private async Task BroadcastAsync(ServerMessage message, string? exceptPlayerId, CancellationToken cancellationToken)
    // {
    //     var sends = _clients.Values
    //         .Where(client => client.Id != exceptPlayerId && client.Socket.State == WebSocketState.Open)
    //         .Select(client => SendAsync(client, message, cancellationToken));

    //     await Task.WhenAll(sends);
    // }

    // private static async Task SendAsync(ClientConnection connection, ServerMessage message, CancellationToken cancellationToken)
    // {
    //     var json = JsonSerializer.Serialize(message, JsonOptions);
    //     var payload = Encoding.UTF8.GetBytes(json);

    //     await connection.SendLock.WaitAsync(cancellationToken);
    //     try
    //     {
    //         if (connection.Socket.State == WebSocketState.Open)
    //         {
    //             await connection.Socket.SendAsync(payload, WebSocketMessageType.Text, true, cancellationToken);
    //         }
    //     }
    //     finally
    //     {
    //         connection.SendLock.Release();
    //     }
    // }