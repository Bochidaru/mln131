namespace server.Protocol;

public sealed record ServerMessage(
    string Type,
    string? PlayerId = null,
    object? Payload = null
);
