using System.Collections.Concurrent;
using System.Numerics;
using server.Models;

namespace server.Networking;

// A two-player, server-authoritative first-to-three duel simulation.
public sealed class DuelRoom
{
    public const int TickRate = 64;
    private const float ArenaLimit = 13f;
    private const float ArenaX = 200f;
    private const float ArenaZ = 200f;
    private const float MoveSpeed = 5f;
    private const float PlayerRadius = 0.55f;
    private readonly ClientConnection _first;
    private readonly ClientConnection _second;
    private readonly Dictionary<string, SavedPose> _returnPoses;
    private readonly ConcurrentDictionary<string, DuelInput> _inputs = new();
    private readonly Dictionary<string, int> _health = new();
    private readonly Dictionary<string, int> _wins = new();
    private readonly Dictionary<string, DateTimeOffset> _lastShot = new();
    private readonly Action<DuelRoom> _finished;
    private readonly CancellationTokenSource _cts = new();
    private Task? _loop;
    private int _hasFinished;

    // These boxes match the cover rendered by DuelArena on the client.
    private static readonly (float X, float Z, float HalfX, float HalfZ)[] Cover =
    [
        (0, 0, 1.25f, 0.6f),
        (-6, -5, 1.25f, 0.6f),
        (6, 5, 1.25f, 0.6f),
        (-5, 6, 1.25f, 0.6f),
        (5, -6, 1.25f, 0.6f),
    ];

    public string Id { get; } = Guid.NewGuid().ToString("N");
    public IEnumerable<string> PlayerIds => [_first.Id, _second.Id];
    public bool Contains(string playerId) => _first.Id == playerId || _second.Id == playerId;

    public DuelRoom(ClientConnection first, ClientConnection second, Action<DuelRoom> finished)
    {
        _first = first; _second = second; _finished = finished;
        _returnPoses = new()
        {
            [first.Id] = new(first.State), [second.Id] = new(second.State)
        };
        _health[first.Id] = _health[second.Id] = 100;
        _wins[first.Id] = _wins[second.Id] = 0;
        SpawnRound();
    }

    public void Start() => _loop = Task.Run(() => Loop(_cts.Token));

    public void SetInput(string playerId, DuelInput input) => _inputs[playerId] = input;

    public void Shoot(string playerId, float dirX, float dirZ)
    {
        if (!Contains(playerId) || _lastShot.TryGetValue(playerId, out var last) && DateTimeOffset.UtcNow - last < TimeSpan.FromMilliseconds(250)) return;
        _lastShot[playerId] = DateTimeOffset.UtcNow;
        var shooter = playerId == _first.Id ? _first : _second;
        var target = playerId == _first.Id ? _second : _first;
        var direction = new Vector2(dirX, dirZ);
        if (direction.LengthSquared() < 0.01f) return;
        direction = Vector2.Normalize(direction);
        var toTarget = new Vector2(target.State.X - shooter.State.X, target.State.Z - shooter.State.Z);
        var distance = toTarget.Length();
        if (distance < 0.01f || distance > 24f || Vector2.Dot(direction, Vector2.Normalize(toTarget)) < 0.965f) return;
        _health[target.Id] = Math.Max(0, _health[target.Id] - 34);
        if (_health[target.Id] == 0) EndRound(shooter.Id);
    }

    public void Abort(string leaverId)
    {
        var winner = leaverId == _first.Id ? _second : _first;
        Finish(winner.Id, aborted: true);
    }

    private async Task Loop(CancellationToken token)
    {
        var delay = TimeSpan.FromSeconds(1d / TickRate);
        try
        {
            while (!token.IsCancellationRequested)
            {
                Tick((float)delay.TotalSeconds);
                await BroadcastAsync(token);
                await Task.Delay(delay, token);
            }
        }
        catch (OperationCanceledException) { }
    }

    private void Tick(float delta)
    {
        foreach (var player in new[] { _first, _second })
        {
            if (!_inputs.TryGetValue(player.Id, out var input)) continue;
            var movement = new Vector2(Math.Clamp(input.MoveX, -1, 1), Math.Clamp(input.MoveZ, -1, 1));
            if (movement.LengthSquared() > 1) movement = Vector2.Normalize(movement);
            var nextX = Math.Clamp(player.State.X + movement.X * MoveSpeed * delta, ArenaX - ArenaLimit, ArenaX + ArenaLimit);
            var nextZ = Math.Clamp(player.State.Z + movement.Y * MoveSpeed * delta, ArenaZ - ArenaLimit, ArenaZ + ArenaLimit);
            if (!HitsCover(nextX, nextZ))
            {
                player.State.X = nextX;
                player.State.Z = nextZ;
            }
            player.State.DirX = input.DirX; player.State.DirZ = input.DirZ; player.State.Area = "duel";
        }
    }

    private void EndRound(string winnerId)
    {
        _wins[winnerId]++;
        if (_wins[winnerId] >= 3) { Finish(winnerId, aborted: false); return; }
        SpawnRound();
    }

    private void SpawnRound()
    {
        _first.State.X = ArenaX - 9; _first.State.Z = ArenaZ; _first.State.DirX = 1; _first.State.DirZ = 0;
        _second.State.X = ArenaX + 9; _second.State.Z = ArenaZ; _second.State.DirX = -1; _second.State.DirZ = 0;
        _health[_first.Id] = _health[_second.Id] = 100;
    }

    private async Task BroadcastAsync(CancellationToken token)
    {
        var payload = new { duelId = Id, duelPlayers = new[] {
            new { playerId = _first.Id, x = _first.State.X, z = _first.State.Z, dirX = _first.State.DirX, dirZ = _first.State.DirZ, hp = _health[_first.Id], wins = _wins[_first.Id] },
            new { playerId = _second.Id, x = _second.State.X, z = _second.State.Z, dirX = _second.State.DirX, dirZ = _second.State.DirZ, hp = _health[_second.Id], wins = _wins[_second.Id] },
        }};
        await Task.WhenAll(_first.SendAsync("duelSnapshot", payload, token), _second.SendAsync("duelSnapshot", payload, token));
    }

    private void Finish(string winnerId, bool aborted)
    {
        if (Interlocked.Exchange(ref _hasFinished, 1) != 0) return;
        _cts.Cancel();
        var loser = winnerId == _first.Id ? _second : _first;
        var transfer = aborted ? 0 : Math.Min(5, loser.State.Score);
        loser.State.Score -= transfer; (winnerId == _first.Id ? _first : _second).State.Score += transfer;
        Restore(_first); Restore(_second);
        _ = Task.WhenAll(
            SendResultAsync(_first, winnerId, transfer, aborted),
            SendResultAsync(_second, winnerId, transfer, aborted));
        _finished(this);
    }

    private Task SendResultAsync(ClientConnection player, string winnerId, int transfer, bool aborted)
    {
        var pose = _returnPoses[player.Id];
        return player.SendAsync("duelResult", new
        {
            winnerId,
            transfer,
            aborted,
            score = player.State.Score,
            returnPose = new { x = pose.X, z = pose.Z, dirX = pose.DirX, dirZ = pose.DirZ }
        }, CancellationToken.None);
    }

    private static bool HitsCover(float x, float z)
    {
        var localX = x - ArenaX;
        var localZ = z - ArenaZ;
        return Cover.Any(cover =>
            Math.Abs(localX - cover.X) < cover.HalfX + PlayerRadius &&
            Math.Abs(localZ - cover.Z) < cover.HalfZ + PlayerRadius);
    }

    private void Restore(ClientConnection player)
    {
        var saved = _returnPoses[player.Id];
        player.State.X = saved.X; player.State.Y = saved.Y; player.State.Z = saved.Z; player.State.DirX = saved.DirX; player.State.DirZ = saved.DirZ; player.State.Area = saved.Area;
    }

    public readonly record struct DuelInput(float MoveX, float MoveZ, float DirX, float DirZ);
    private readonly record struct SavedPose(float X, float Y, float Z, float DirX, float DirZ, string Area)
    { public SavedPose(PlayerState state) : this(state.X, state.Y, state.Z, state.DirX, state.DirZ, state.Area) { } }
}
