namespace server.Networking;
public class GameRoomFactory
{
    private readonly ILogger<GameRoom> _logger;
    private readonly DuelManager _duels;
    public GameRoomFactory(ILogger<GameRoom> logger, DuelManager duels) { _logger = logger; _duels = duels; }

    public GameRoom Create(string id, int tickRate) => new GameRoom(_logger, _duels, id, tickRate);
}
