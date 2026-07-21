using System.Text.Json;

namespace server.Protocol;

public sealed record ClientMessage(
    string Type,
    JsonElement? Payload = null
);
