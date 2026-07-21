using Microsoft.AspNetCore.StaticFiles;
using server.Networking;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<GameRoomFactory>();
builder.Services.AddSingleton<ConnectionManager>();
builder.Services.AddSingleton<DuelManager>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors();

var staticFileTypes = new FileExtensionContentTypeProvider();
staticFileTypes.Mappings[".hdr"] = "application/octet-stream";

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = staticFileTypes,
});

app.UseWebSockets(new WebSocketOptions
{
    KeepAliveInterval = TimeSpan.FromSeconds(20),
});

app.MapGet("/health", (ConnectionManager connections) => Results.Ok(new
{
    status = "ok",
    online = connections.OnlineCount,
}));

app.Map("/ws", async (HttpContext context, ConnectionManager connections) =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        await context.Response.WriteAsync("Expected a WebSocket request.");
        return;
    }

    using var socket = await context.WebSockets.AcceptWebSocketAsync();
    await connections.HandleAsync(socket, context.RequestAborted);
});

app.MapFallbackToFile("index.html");

app.Run();
