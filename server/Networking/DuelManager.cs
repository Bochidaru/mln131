using System.Collections.Concurrent;

namespace server.Networking;

public sealed class DuelManager
{
    private static readonly TimeSpan InviteDuration = TimeSpan.FromSeconds(10);
    private const int MinimumScoreToDuel = 10;
    private readonly ConcurrentDictionary<string, DuelRoom> _duels = new();
    private readonly ConcurrentDictionary<string, string> _playerDuels = new();
    private readonly ConcurrentDictionary<string, DuelInvite> _invites = new();
    private readonly ConcurrentDictionary<string, DateTimeOffset> _requestCooldowns = new();

    public bool IsInDuel(string playerId) => _playerDuels.ContainsKey(playerId);
    public IReadOnlyList<DuelAdminSnapshot> GetAdminDuels() => _duels.Values
        .Select(duel => duel.GetAdminSnapshot())
        .OrderBy(duel => duel.Id)
        .ToArray();

    public void Request(ClientConnection requester, ClientConnection target)
    {
        var now = DateTimeOffset.UtcNow;
        if (requester.State.Score < MinimumScoreToDuel)
        {
            _ = requester.SendAsync("pvpRequestRejected", new { reason = "Bạn cần ít nhất 10 điểm để thách đấu." }, CancellationToken.None);
            return;
        }
        if (target.State.Score < MinimumScoreToDuel)
        {
            _ = requester.SendAsync("pvpRequestRejected", new { reason = "Người chơi này chưa đủ 10 điểm để tham gia PvP." }, CancellationToken.None);
            return;
        }
        if (_requestCooldowns.TryGetValue(requester.Id, out var cooldownUntil) && cooldownUntil > now)
        {
            _ = requester.SendAsync("pvpCooldown", new { cooldownUntil }, CancellationToken.None);
            return;
        }
        if (requester.Id == target.Id || IsInDuel(requester.Id) || IsInDuel(target.Id)
            || _invites.Values.Any(invite => invite.Requester.Id == requester.Id))
        {
            _ = requester.SendAsync("pvpRequestRejected", new { reason = "Không thể gửi lời mời lúc này." }, CancellationToken.None);
            return;
        }
        var dx = requester.State.X - target.State.X;
        var dz = requester.State.Z - target.State.Z;
        if (dx * dx + dz * dz > 3.5f * 3.5f)
        {
            _ = requester.SendAsync("pvpRequestRejected", new { reason = "Người chơi đã ở quá xa." }, CancellationToken.None);
            return;
        }

        var expiresAt = now.Add(InviteDuration);
        var invite = new DuelInvite(Guid.NewGuid().ToString("N"), requester, target, expiresAt);
        if (!_invites.TryAdd(target.Id, invite))
        {
            _ = requester.SendAsync("pvpRequestRejected", new { reason = "Người chơi đang có một lời mời khác." }, CancellationToken.None);
            return;
        }

        _requestCooldowns[requester.Id] = expiresAt;
        _ = target.SendAsync("pvpInvite", new { fromPlayerId = requester.Id, name = requester.State.Name, expiresAt }, CancellationToken.None);
        _ = requester.SendAsync("pvpInviteSent", new { targetPlayerId = target.Id, targetName = target.State.Name, expiresAt, cooldownUntil = expiresAt }, CancellationToken.None);
        _ = ExpireInviteAsync(invite);
    }

    public void Respond(ClientConnection target, ClientConnection? requester, bool accepted)
    {
        if (!_invites.TryGetValue(target.Id, out var invite) || requester?.Id != invite.Requester.Id || !TryRemoveInvite(invite)) return;
        if (invite.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            _ = target.SendAsync("pvpInviteExpired", new { fromPlayerId = invite.Requester.Id }, CancellationToken.None);
            _ = invite.Requester.SendAsync("pvpInviteExpired", new { targetPlayerId = target.Id }, CancellationToken.None);
            return;
        }
        if (!accepted || IsInDuel(target.Id) || IsInDuel(requester.Id))
        {
            _ = requester.SendAsync("pvpDeclined", new { targetPlayerId = target.Id }, CancellationToken.None);
            return;
        }
        if (requester.State.Score < MinimumScoreToDuel || target.State.Score < MinimumScoreToDuel)
        {
            const string reason = "Cả hai người chơi cần ít nhất 10 điểm để tham gia PvP.";
            _ = requester.SendAsync("pvpRequestRejected", new { reason }, CancellationToken.None);
            _ = target.SendAsync("pvpRequestRejected", new { reason }, CancellationToken.None);
            return;
        }

        var duel = new DuelRoom(requester, target, Finish);
        _duels[duel.Id] = duel;
        _playerDuels[requester.Id] = duel.Id;
        _playerDuels[target.Id] = duel.Id;
        _ = Task.WhenAll(
            requester.SendAsync("duelStart", new { duelId = duel.Id, opponent = target.State.Name }, CancellationToken.None),
            target.SendAsync("duelStart", new { duelId = duel.Id, opponent = requester.State.Name }, CancellationToken.None));
        duel.Start();
    }

    public void Input(string playerId, DuelRoom.DuelInput input)
    {
        if (_playerDuels.TryGetValue(playerId, out var id) && _duels.TryGetValue(id, out var duel)) duel.SetInput(playerId, input);
    }

    public void Shoot(string playerId, float dirX, float dirZ)
    {
        if (_playerDuels.TryGetValue(playerId, out var id) && _duels.TryGetValue(id, out var duel)) duel.Shoot(playerId, dirX, dirZ);
    }

    public void Forfeit(string playerId)
    {
        if (_playerDuels.TryGetValue(playerId, out var id) && _duels.TryGetValue(id, out var duel)) duel.Forfeit(playerId);
    }

    public void PlayerLeft(string playerId)
    {
        if (_playerDuels.TryGetValue(playerId, out var id) && _duels.TryGetValue(id, out var duel)) duel.Abort(playerId);
        _requestCooldowns.TryRemove(playerId, out _);
        foreach (var invite in _invites.Values.Where(invite => invite.Target.Id == playerId || invite.Requester.Id == playerId))
        {
            if (!TryRemoveInvite(invite)) continue;
            if (invite.Requester.Id == playerId)
                _ = invite.Target.SendAsync("pvpInviteExpired", new { fromPlayerId = playerId }, CancellationToken.None);
            else
                _ = invite.Requester.SendAsync("pvpInviteExpired", new { targetPlayerId = playerId }, CancellationToken.None);
        }
    }

    private async Task ExpireInviteAsync(DuelInvite invite)
    {
        var delay = invite.ExpiresAt - DateTimeOffset.UtcNow;
        if (delay > TimeSpan.Zero) await Task.Delay(delay);
        if (!TryRemoveInvite(invite)) return;

        await Task.WhenAll(
            invite.Target.SendAsync("pvpInviteExpired", new { fromPlayerId = invite.Requester.Id }, CancellationToken.None),
            invite.Requester.SendAsync("pvpInviteExpired", new { targetPlayerId = invite.Target.Id }, CancellationToken.None));
    }

    private bool TryRemoveInvite(DuelInvite invite)
    {
        return ((ICollection<KeyValuePair<string, DuelInvite>>)_invites)
            .Remove(new KeyValuePair<string, DuelInvite>(invite.Target.Id, invite));
    }

    private void Finish(DuelRoom duel)
    {
        _duels.TryRemove(duel.Id, out _);
        foreach (var playerId in duel.PlayerIds) _playerDuels.TryRemove(playerId, out _);
    }

    private sealed record DuelInvite(string Id, ClientConnection Requester, ClientConnection Target, DateTimeOffset ExpiresAt);
}

public sealed record DuelPlayerAdminSnapshot(string Id, string Name, int Score, int Wins);
public sealed record DuelAdminSnapshot(string Id, DuelPlayerAdminSnapshot First, DuelPlayerAdminSnapshot Second, bool Finishing);
