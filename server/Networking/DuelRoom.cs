using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Numerics;
using server.Models;

namespace server.Networking;

// A two-player, server-authoritative first-to-three duel simulation.
public sealed class DuelRoom
{
    public const int TickRate = 64;
    private static readonly TimeSpan ResultDisplayDuration = TimeSpan.FromSeconds(3);
    private const int DuelStake = 5;
    private const float ArenaLimit = 28f;
    private const float ArenaX = 200f;
    private const float ArenaZ = 200f;
    private const float MoveSpeed = 5f;
    private const float SprintMoveSpeed = 7f;
    private const float EyeHeight = 1.68f;
    private const float JumpSpeed = 5f;
    private const float Gravity = 14f;
    private const float PlayerRadius = 0.55f;
    private readonly ClientConnection _first;
    private readonly ClientConnection _second;
    private readonly Dictionary<string, SavedPose> _returnPoses;
    private readonly ConcurrentDictionary<string, DuelInput> _inputs = new();
    private readonly Dictionary<string, int> _health = new();
    private readonly Dictionary<string, int> _wins = new();
    private readonly Dictionary<string, DateTimeOffset> _lastShot = new();
    private readonly Dictionary<string, float> _verticalVelocity = new();
    private readonly Dictionary<string, bool> _jumpHeld = new();
    private readonly Action<DuelRoom> _finished;
    private readonly CancellationTokenSource _cts = new();
    private Task? _loop;
    private int _hasFinished;

    // These boxes match the cover rendered by DuelArena on the client.
    private static readonly (float X, float Z, float HalfX, float HalfZ)[] Cover =
    [
        (0, 0, 2.2f, 0.8f),
        (-12, -10, 2.2f, 0.8f), (12, 10, 2.2f, 0.8f),
        (-12, 12, 2.2f, 0.8f), (12, -12, 2.2f, 0.8f),
        (0, -18, 2.2f, 0.8f), (0, 18, 2.2f, 0.8f),
        (-20, 0, 2.2f, 0.8f), (20, 0, 2.2f, 0.8f),
    ];

    public string Id { get; } = Guid.NewGuid().ToString("N");
    public IEnumerable<string> PlayerIds => [_first.Id, _second.Id];
    public bool Contains(string playerId) => _first.Id == playerId || _second.Id == playerId;
    public DuelAdminSnapshot GetAdminSnapshot() => new(
        Id,
        new DuelPlayerAdminSnapshot(_first.Id, _first.State.Name, _first.State.Score, _wins[_first.Id]),
        new DuelPlayerAdminSnapshot(_second.Id, _second.State.Name, _second.State.Score, _wins[_second.Id]),
        Volatile.Read(ref _hasFinished) != 0);

    public DuelRoom(ClientConnection first, ClientConnection second, Action<DuelRoom> finished)
    {
        _first = first; _second = second; _finished = finished;
        _returnPoses = new()
        {
            [first.Id] = new(first.State), [second.Id] = new(second.State)
        };
        _health[first.Id] = _health[second.Id] = 100;
        _wins[first.Id] = _wins[second.Id] = 0;
        _verticalVelocity[first.Id] = _verticalVelocity[second.Id] = 0;
        _jumpHeld[first.Id] = _jumpHeld[second.Id] = false;
        SpawnRound();
    }

    public void Start() => _loop = Task.Run(() => Loop(_cts.Token));

    public void SetInput(string playerId, DuelInput input)
    {
        if (Volatile.Read(ref _hasFinished) == 0) _inputs[playerId] = input;
    }

    public void Shoot(string playerId, float dirX, float dirZ)
    {
        if (Volatile.Read(ref _hasFinished) != 0 || !Contains(playerId) || _lastShot.TryGetValue(playerId, out var last) && DateTimeOffset.UtcNow - last < TimeSpan.FromMilliseconds(250)) return;
        _lastShot[playerId] = DateTimeOffset.UtcNow;
        var shooter = playerId == _first.Id ? _first : _second;
        var target = playerId == _first.Id ? _second : _first;
        var direction = new Vector2(dirX, dirZ);
        if (direction.LengthSquared() < 0.01f) return;
        direction = Vector2.Normalize(direction);
        var toTarget = new Vector2(target.State.X - shooter.State.X, target.State.Z - shooter.State.Z);
        var projection = Vector2.Dot(toTarget, direction);
        var perpendicular = projection > 0 ? (toTarget - direction * projection).Length() : float.PositiveInfinity;
        var obstacleDistance = DistanceToFirstObstacle(new Vector2(shooter.State.X, shooter.State.Z), direction);
        var hit = projection > 0 && projection <= obstacleDistance && perpendicular <= PlayerRadius + 0.18f;
        var shotDistance = hit ? projection : obstacleDistance;
        var endX = shooter.State.X + direction.X * shotDistance;
        var endZ = shooter.State.Z + direction.Y * shotDistance;
        var startY = Math.Max(EyeHeight - 0.22f, shooter.State.Y - 0.22f);
        var endY = hit ? Math.Max(0.8f, target.State.Y - 0.25f) : startY;

        _ = BroadcastShotAsync(new
        {
            shotId = Guid.NewGuid().ToString("N"),
            shooterId = shooter.Id,
            startX = shooter.State.X,
            startY,
            startZ = shooter.State.Z,
            endX,
            endY,
            endZ,
            hit
        });

        if (!hit) return;
        _health[target.Id] = Math.Max(0, _health[target.Id] - 34);
        if (_health[target.Id] == 0) EndRound(shooter.Id);
    }

    public void Abort(string leaverId)
    {
        var winner = leaverId == _first.Id ? _second : _first;
        Finish(winner.Id, aborted: true);
    }

    public void Forfeit(string playerId)
    {
        if (!Contains(playerId)) return;
        Abort(playerId);
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
            var speed = input.Sprinting ? SprintMoveSpeed : MoveSpeed;
            var nextX = Math.Clamp(player.State.X + movement.X * speed * delta, ArenaX - ArenaLimit, ArenaX + ArenaLimit);
            var nextZ = Math.Clamp(player.State.Z + movement.Y * speed * delta, ArenaZ - ArenaLimit, ArenaZ + ArenaLimit);
            if (!HitsCover(nextX, nextZ))
            {
                player.State.X = nextX;
                player.State.Z = nextZ;
            }
            var wasJumpHeld = _jumpHeld[player.Id];
            if (input.Jump && !wasJumpHeld && player.State.Y <= EyeHeight + 0.001f)
            {
                _verticalVelocity[player.Id] = JumpSpeed;
            }
            _jumpHeld[player.Id] = input.Jump;
            _verticalVelocity[player.Id] -= Gravity * delta;
            player.State.Y += _verticalVelocity[player.Id] * delta;
            if (player.State.Y <= EyeHeight)
            {
                player.State.Y = EyeHeight;
                _verticalVelocity[player.Id] = 0;
            }
            player.State.DirX = input.DirX; player.State.DirZ = input.DirZ; player.State.Area = "duel";
            player.State.Pose = input.Pose;
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
        _first.State.X = ArenaX - 22; _first.State.Z = ArenaZ - 22; _first.State.DirX = 1; _first.State.DirZ = 1;
        _second.State.X = ArenaX + 22; _second.State.Z = ArenaZ + 22; _second.State.DirX = -1; _second.State.DirZ = -1;
        _first.State.Y = _second.State.Y = EyeHeight;
        _verticalVelocity[_first.Id] = _verticalVelocity[_second.Id] = 0;
        _jumpHeld[_first.Id] = _jumpHeld[_second.Id] = false;
        _health[_first.Id] = _health[_second.Id] = 100;
    }

    private async Task BroadcastAsync(CancellationToken token)
    {
        var payload = new { duelId = Id, duelPlayers = new[] {
            new { playerId = _first.Id, avatarId = _first.State.AvatarId, pose = _first.State.Pose, x = _first.State.X, y = _first.State.Y, z = _first.State.Z, dirX = _first.State.DirX, dirZ = _first.State.DirZ, hp = _health[_first.Id], wins = _wins[_first.Id] },
            new { playerId = _second.Id, avatarId = _second.State.AvatarId, pose = _second.State.Pose, x = _second.State.X, y = _second.State.Y, z = _second.State.Z, dirX = _second.State.DirX, dirZ = _second.State.DirZ, hp = _health[_second.Id], wins = _wins[_second.Id] },
        }};
        await Task.WhenAll(_first.SendAsync("duelSnapshot", payload, token), _second.SendAsync("duelSnapshot", payload, token));
    }

    private Task BroadcastShotAsync(object payload) => Task.WhenAll(
        _first.SendAsync("duelShot", payload, CancellationToken.None),
        _second.SendAsync("duelShot", payload, CancellationToken.None));

    private void Finish(string winnerId, bool aborted)
    {
        if (Interlocked.Exchange(ref _hasFinished, 1) != 0) return;
        _cts.Cancel();
        var winner = winnerId == _first.Id ? _first : _second;
        var loser = winnerId == _first.Id ? _second : _first;
        if (aborted && _wins[winnerId] < 3) _wins[winnerId] = 3;
        var transfer = DuelStake;
        loser.State.Score -= transfer;
        winner.State.Score += transfer;
        _ = CompleteAfterResultDisplayAsync(winner, loser, transfer, aborted);
    }

    private async Task CompleteAfterResultDisplayAsync(ClientConnection winner, ClientConnection loser, int transfer, bool aborted)
    {
        var returnsAt = DateTimeOffset.UtcNow.Add(ResultDisplayDuration);
        await Task.WhenAll(
            SendFinishedAsync(_first, winner, loser, transfer, aborted, returnsAt),
            SendFinishedAsync(_second, winner, loser, transfer, aborted, returnsAt));

        await Task.Delay(ResultDisplayDuration);
        Restore(_first);
        Restore(_second);
        await Task.WhenAll(SendResultAsync(_first, winner.Id), SendResultAsync(_second, winner.Id));
        _finished(this);
    }

    private Task SendFinishedAsync(ClientConnection player, ClientConnection winner, ClientConnection loser, int transfer, bool aborted, DateTimeOffset returnsAt) =>
        SafeSendAsync(player, "duelFinished", new
        {
            winnerId = winner.Id,
            winnerName = winner.State.Name,
            winnerWins = _wins[winner.Id],
            winnerScore = winner.State.Score,
            loserId = loser.Id,
            loserName = loser.State.Name,
            loserWins = _wins[loser.Id],
            loserScore = loser.State.Score,
            transfer,
            aborted,
            returnsAt
        });

    private Task SendResultAsync(ClientConnection player, string winnerId)
    {
        var pose = _returnPoses[player.Id];
        return SafeSendAsync(player, "duelResult", new
        {
            winnerId,
            score = player.State.Score,
            returnPose = new { x = pose.X, z = pose.Z, dirX = pose.DirX, dirZ = pose.DirZ }
        });
    }

    private static async Task SafeSendAsync(ClientConnection player, string type, object payload)
    {
        try { await player.SendAsync(type, payload, CancellationToken.None); }
        catch (WebSocketException) { }
        catch (ObjectDisposedException) { }
    }

    private static bool HitsCover(float x, float z)
    {
        var localX = x - ArenaX;
        var localZ = z - ArenaZ;
        return Cover.Any(cover =>
            Math.Abs(localX - cover.X) < cover.HalfX + PlayerRadius &&
            Math.Abs(localZ - cover.Z) < cover.HalfZ + PlayerRadius);
    }

    private static float DistanceToFirstObstacle(Vector2 worldOrigin, Vector2 direction)
    {
        var origin = new Vector2(worldOrigin.X - ArenaX, worldOrigin.Y - ArenaZ);
        var boundaryX = direction.X > 0
            ? (ArenaLimit - origin.X) / direction.X
            : direction.X < 0 ? (-ArenaLimit - origin.X) / direction.X : float.PositiveInfinity;
        var boundaryZ = direction.Y > 0
            ? (ArenaLimit - origin.Y) / direction.Y
            : direction.Y < 0 ? (-ArenaLimit - origin.Y) / direction.Y : float.PositiveInfinity;
        var nearest = Math.Min(boundaryX, boundaryZ);

        foreach (var cover in Cover)
        {
            nearest = Math.Min(nearest, RayBoxDistance(origin, direction, cover));
        }
        return Math.Clamp(nearest, 0.1f, ArenaLimit * 2);
    }

    private static float RayBoxDistance(Vector2 origin, Vector2 direction, (float X, float Z, float HalfX, float HalfZ) box)
    {
        var minimum = 0f;
        var maximum = float.PositiveInfinity;
        if (!ClipRayAxis(origin.X, direction.X, box.X - box.HalfX - PlayerRadius, box.X + box.HalfX + PlayerRadius, ref minimum, ref maximum)
            || !ClipRayAxis(origin.Y, direction.Y, box.Z - box.HalfZ - PlayerRadius, box.Z + box.HalfZ + PlayerRadius, ref minimum, ref maximum))
        {
            return float.PositiveInfinity;
        }
        return minimum > 0.01f ? minimum : float.PositiveInfinity;
    }

    private static bool ClipRayAxis(float origin, float direction, float minimumBound, float maximumBound, ref float minimum, ref float maximum)
    {
        if (Math.Abs(direction) < 0.0001f) return origin >= minimumBound && origin <= maximumBound;
        var first = (minimumBound - origin) / direction;
        var second = (maximumBound - origin) / direction;
        if (first > second) (first, second) = (second, first);
        minimum = Math.Max(minimum, first);
        maximum = Math.Min(maximum, second);
        return maximum >= minimum;
    }

    private void Restore(ClientConnection player)
    {
        var saved = _returnPoses[player.Id];
        player.State.X = saved.X; player.State.Y = saved.Y; player.State.Z = saved.Z; player.State.DirX = saved.DirX; player.State.DirZ = saved.DirZ; player.State.Area = saved.Area;
    }

    public readonly record struct DuelInput(float MoveX, float MoveZ, float DirX, float DirZ, bool Sprinting, bool Jump, int Pose);
    private readonly record struct SavedPose(float X, float Y, float Z, float DirX, float DirZ, string Area)
    { public SavedPose(PlayerState state) : this(state.X, state.Y, state.Z, state.DirX, state.DirZ, state.Area) { } }
}
