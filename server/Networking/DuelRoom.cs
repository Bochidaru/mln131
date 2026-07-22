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
    private const float HighJumpSpeed = 8.5f;
    private const float Gravity = 14f;
    private const float PlayerRadius = 0.55f;
    private const float DashDistance = 6f;
    private const float BlinkDistance = 10f;
    private static readonly TimeSpan BasicCooldown = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan UltimateCooldown = TimeSpan.FromSeconds(30);
    private readonly ClientConnection _first;
    private readonly ClientConnection _second;
    private readonly Dictionary<string, SavedPose> _returnPoses;
    private readonly ConcurrentDictionary<string, DuelInput> _inputs = new();
    private readonly Dictionary<string, int> _health = new();
    private readonly Dictionary<string, int> _wins = new();
    private readonly Dictionary<string, DateTimeOffset> _lastShot = new();
    private readonly Dictionary<string, float> _verticalVelocity = new();
    private readonly Dictionary<string, bool> _jumpHeld = new();
    private readonly Dictionary<string, AbilityState> _abilities = new();
    private readonly Dictionary<string, Queue<PositionSample>> _positionHistory = new();
    private readonly object _abilityGate = new();
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
        _abilities[first.Id] = new(); _abilities[second.Id] = new();
        _positionHistory[first.Id] = new(); _positionHistory[second.Id] = new();
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
        lock (_abilityGate)
        {
            var ability = _abilities[playerId];
            if (ability.ActiveSkillId == "veil") ability.ActiveUntil = DateTimeOffset.MinValue;
        }
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

    public void UseAbility(string playerId, int slot, float dirX, float dirZ)
    {
        if (Volatile.Read(ref _hasFinished) != 0 || !Contains(playerId) || slot is < 0 or > 2) return;
        var player = playerId == _first.Id ? _first : _second;
        var now = DateTimeOffset.UtcNow;
        var direction = new Vector2(dirX, dirZ);
        if (direction.LengthSquared() < 0.01f) direction = new Vector2(player.State.DirX, player.State.DirZ);
        if (direction.LengthSquared() < 0.01f) direction = Vector2.UnitY;
        direction = Vector2.Normalize(direction);

        lock (_abilityGate)
        {
            var ability = _abilities[playerId];
            if (slot == 0)
            {
                if (ability.DashReadyAt > now || !MoveAlongDirection(player, direction, DashDistance)) return;
                ability.DashReadyAt = now.Add(BasicCooldown);
            }
            else if (slot == 1)
            {
                if (ability.HighJumpReadyAt > now || player.State.Y > EyeHeight + 0.001f) return;
                _verticalVelocity[playerId] = HighJumpSpeed;
                ability.HighJumpReadyAt = now.Add(BasicCooldown);
            }
            else
            {
                if (ability.UltimateReadyAt > now || !ActivateUltimate(player, ability, direction, now)) return;
                ability.UltimateReadyAt = now.Add(UltimateCooldown);
            }
        }

        _ = BroadcastAbilityAsync(new
        {
            playerId,
            slot,
            skillId = slot == 2 ? player.EquippedUltimateSkill : slot == 0 ? "dash" : "high-jump",
            x = player.State.X,
            y = player.State.Y,
            z = player.State.Z,
        });
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
        var now = DateTimeOffset.UtcNow;
        foreach (var player in new[] { _first, _second })
        {
            _inputs.TryGetValue(player.Id, out var input);
            var movement = new Vector2(Math.Clamp(input.MoveX, -1, 1), Math.Clamp(input.MoveZ, -1, 1));
            if (movement.LengthSquared() > 1) movement = Vector2.Normalize(movement);
            var speed = input.Sprinting ? SprintMoveSpeed : MoveSpeed;
            var gravity = Gravity;
            lock (_abilityGate)
            {
                var ability = _abilities[player.Id];
                if (ability.ActiveUntil > now)
                {
                    if (ability.ActiveSkillId == UltimateSkillCatalog.DefaultSkillId) speed *= 1.25f;
                    else if (ability.ActiveSkillId == "overdrive") speed *= 1.6f;
                    else if (ability.ActiveSkillId == "feather") gravity *= 0.45f;
                }
            }
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
            _verticalVelocity[player.Id] -= gravity * delta;
            player.State.Y += _verticalVelocity[player.Id] * delta;
            if (player.State.Y <= EyeHeight)
            {
                player.State.Y = EyeHeight;
                _verticalVelocity[player.Id] = 0;
            }
            player.State.DirX = input.DirX; player.State.DirZ = input.DirZ; player.State.Area = "duel";
            player.State.Pose = input.Pose;
            RecordPosition(player, now);
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
        lock (_abilityGate)
        {
            foreach (var player in new[] { _first, _second })
            {
                var ability = _abilities[player.Id];
                ability.DashReadyAt = DateTimeOffset.MinValue;
                ability.HighJumpReadyAt = DateTimeOffset.MinValue;
                ability.UltimateReadyAt = DateTimeOffset.MinValue;
                ability.ActiveSkillId = null;
                ability.ActiveUntil = DateTimeOffset.MinValue;
                _positionHistory[player.Id].Clear();
                _positionHistory[player.Id].Enqueue(new(DateTimeOffset.UtcNow, player.State.X, player.State.Y, player.State.Z));
            }
        }
    }

    private async Task BroadcastAsync(CancellationToken token)
    {
        var now = DateTimeOffset.UtcNow;
        var payload = new { duelId = Id, duelPlayers = new[] { CreatePlayerSnapshot(_first, now), CreatePlayerSnapshot(_second, now) } };
        await Task.WhenAll(_first.SendAsync("duelSnapshot", payload, token), _second.SendAsync("duelSnapshot", payload, token));
    }

    private Task BroadcastShotAsync(object payload) => Task.WhenAll(
        _first.SendAsync("duelShot", payload, CancellationToken.None),
        _second.SendAsync("duelShot", payload, CancellationToken.None));

    private Task BroadcastAbilityAsync(object payload) => Task.WhenAll(
        _first.SendAsync("duelAbility", payload, CancellationToken.None),
        _second.SendAsync("duelAbility", payload, CancellationToken.None));

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

    private bool ActivateUltimate(ClientConnection player, AbilityState ability, Vector2 direction, DateTimeOffset now)
    {
        var skillId = player.EquippedUltimateSkill;
        if (!player.OwnedUltimateSkills.Contains(skillId)) return false;

        ability.ActiveSkillId = skillId;
        ability.ActiveUntil = skillId switch
        {
            UltimateSkillCatalog.DefaultSkillId => now.AddSeconds(4),
            "veil" => now.AddSeconds(3),
            "overdrive" => now.AddSeconds(5),
            "feather" => now.AddSeconds(6),
            _ => now,
        };

        if (skillId == "blink") return MoveAlongDirection(player, direction, BlinkDistance);
        if (skillId == "rewind") return RewindPlayer(player, now);
        return skillId is UltimateSkillCatalog.DefaultSkillId or "veil" or "overdrive" or "feather";
    }

    private static bool MoveAlongDirection(ClientConnection player, Vector2 direction, float distance)
    {
        var startX = player.State.X;
        var startZ = player.State.Z;
        var lastX = startX;
        var lastZ = startZ;
        const float step = 0.25f;
        for (var travelled = step; travelled <= distance + 0.001f; travelled += step)
        {
            var nextX = Math.Clamp(startX + direction.X * travelled, ArenaX - ArenaLimit, ArenaX + ArenaLimit);
            var nextZ = Math.Clamp(startZ + direction.Y * travelled, ArenaZ - ArenaLimit, ArenaZ + ArenaLimit);
            if (HitsCover(nextX, nextZ)) break;
            lastX = nextX;
            lastZ = nextZ;
            if (nextX is <= ArenaX - ArenaLimit or >= ArenaX + ArenaLimit
                || nextZ is <= ArenaZ - ArenaLimit or >= ArenaZ + ArenaLimit) break;
        }
        if (Math.Abs(lastX - startX) < 0.05f && Math.Abs(lastZ - startZ) < 0.05f) return false;
        player.State.X = lastX;
        player.State.Z = lastZ;
        return true;
    }

    private bool RewindPlayer(ClientConnection player, DateTimeOffset now)
    {
        var history = _positionHistory[player.Id];
        if (history.Count == 0) return false;
        var targetTime = now.AddSeconds(-3);
        var selected = history.Peek();
        foreach (var sample in history)
        {
            if (sample.Timestamp > targetTime) break;
            selected = sample;
        }
        if (HitsCover(selected.X, selected.Z)) return false;
        player.State.X = selected.X;
        player.State.Y = Math.Max(EyeHeight, selected.Y);
        player.State.Z = selected.Z;
        _verticalVelocity[player.Id] = 0;
        return true;
    }

    private void RecordPosition(ClientConnection player, DateTimeOffset now)
    {
        lock (_abilityGate)
        {
            var history = _positionHistory[player.Id];
            history.Enqueue(new(now, player.State.X, player.State.Y, player.State.Z));
            var cutoff = now.AddSeconds(-3.25);
            while (history.Count > 1 && history.Peek().Timestamp < cutoff) history.Dequeue();
        }
    }

    private DuelPlayerSnapshot CreatePlayerSnapshot(ClientConnection player, DateTimeOffset now)
    {
        lock (_abilityGate)
        {
            var ability = _abilities[player.Id];
            return new(
                player.Id,
                player.State.AvatarId,
                player.State.IsGuide,
                player.State.Pose,
                player.State.X,
                player.State.Y,
                player.State.Z,
                player.State.DirX,
                player.State.DirZ,
                _health[player.Id],
                _wins[player.Id],
                ability.ActiveSkillId == "veil" && ability.ActiveUntil > now,
                RemainingMilliseconds(ability.DashReadyAt, now),
                RemainingMilliseconds(ability.HighJumpReadyAt, now),
                RemainingMilliseconds(ability.UltimateReadyAt, now),
                player.EquippedUltimateSkill,
                RemainingMilliseconds(ability.ActiveUntil, now));
        }
    }

    private static long RemainingMilliseconds(DateTimeOffset readyAt, DateTimeOffset now) =>
        readyAt <= now ? 0 : (long)Math.Ceiling((readyAt - now).TotalMilliseconds);

    private void Restore(ClientConnection player)
    {
        var saved = _returnPoses[player.Id];
        player.State.X = saved.X; player.State.Y = saved.Y; player.State.Z = saved.Z; player.State.DirX = saved.DirX; player.State.DirZ = saved.DirZ; player.State.Area = saved.Area;
    }

    public readonly record struct DuelInput(float MoveX, float MoveZ, float DirX, float DirZ, bool Sprinting, bool Jump, int Pose);
    private sealed class AbilityState
    {
        public DateTimeOffset DashReadyAt { get; set; } = DateTimeOffset.MinValue;
        public DateTimeOffset HighJumpReadyAt { get; set; } = DateTimeOffset.MinValue;
        public DateTimeOffset UltimateReadyAt { get; set; } = DateTimeOffset.MinValue;
        public string? ActiveSkillId { get; set; }
        public DateTimeOffset ActiveUntil { get; set; } = DateTimeOffset.MinValue;
    }
    private readonly record struct PositionSample(DateTimeOffset Timestamp, float X, float Y, float Z);
    private sealed record DuelPlayerSnapshot(
        string PlayerId,
        string AvatarId,
        bool IsGuide,
        int Pose,
        float X,
        float Y,
        float Z,
        float DirX,
        float DirZ,
        int Hp,
        int Wins,
        bool Invisible,
        long DashCooldownMs,
        long HighJumpCooldownMs,
        long UltimateCooldownMs,
        string UltimateId,
        long UltimateActiveMs);
    private readonly record struct SavedPose(float X, float Y, float Z, float DirX, float DirZ, string Area)
    { public SavedPose(PlayerState state) : this(state.X, state.Y, state.Z, state.DirX, state.DirZ, state.Area) { } }
}
