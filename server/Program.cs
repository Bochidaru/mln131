using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;
using server.Admin;
using server.Networking;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<GameRoomFactory>();
builder.Services.AddSingleton<ConnectionManager>();
builder.Services.AddSingleton<DuelManager>();
builder.Services.Configure<AdminOptions>(builder.Configuration.GetSection("Admin"));
builder.Services.AddSingleton<ServerMetrics>();

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

app.MapGet("/admin", (HttpContext context, IOptions<AdminOptions> options) =>
    AdminAuthentication.IsAuthorized(context, options)
        ? Results.Content(AdminDashboardPage.Html, "text/html; charset=utf-8")
        : Results.Unauthorized());

app.MapGet("/admin/api/status", (HttpContext context, IOptions<AdminOptions> options, ConnectionManager connections, ServerMetrics metrics) =>
{
    if (!AdminAuthentication.IsAuthorized(context, options)) return Results.Unauthorized();
    var status = connections.GetAdminStatus();
    return Results.Ok(new { status.OnlineCount, status.Players, status.Duels, Metrics = metrics.GetSnapshot() });
});

app.MapPost("/admin/api/players/{playerId}/kick", async (string playerId, HttpContext context, IOptions<AdminOptions> options, ConnectionManager connections) =>
{
    if (!AdminAuthentication.IsAuthorized(context, options)) return Results.Unauthorized();
    return await connections.KickPlayerAsync(playerId, context.RequestAborted) ? Results.NoContent() : Results.NotFound();
});

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
