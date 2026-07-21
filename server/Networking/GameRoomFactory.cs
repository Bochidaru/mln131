namespace server.Networking;
public class GameRoomFactory
{
    private readonly ILogger<GameRoom> _logger;
    public GameRoomFactory(ILogger<GameRoom> logger) => _logger = logger;

    public GameRoom Create(string id, int tickRate) => new GameRoom(_logger, id, tickRate);
}
