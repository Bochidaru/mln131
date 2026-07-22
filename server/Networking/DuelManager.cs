using System.Collections.Concurrent;

namespace server.Networking;

public sealed class DuelManager
{
    private readonly ConcurrentDictionary<string, DuelRoom> _duels = new();
    private readonly ConcurrentDictionary<string, string> _playerDuels = new();
    private readonly ConcurrentDictionary<string, string> _invites = new();

    public bool IsInDuel(string playerId) => _playerDuels.ContainsKey(playerId);

    public void Request(ClientConnection requester, ClientConnection target)
    {
        if (requester.Id == target.Id || IsInDuel(requester.Id) || IsInDuel(target.Id)) return;
        var dx = requester.State.X - target.State.X;
        var dz = requester.State.Z - target.State.Z;
        if (dx * dx + dz * dz > 3.5f * 3.5f) return;
        _invites[target.Id] = requester.Id;
        _ = target.SendAsync("pvpInvite", new { fromPlayerId = requester.Id, name = requester.State.Name }, CancellationToken.None);
        _ = requester.SendAsync("pvpInviteSent", new { targetPlayerId = target.Id }, CancellationToken.None);
    }

    public void Respond(ClientConnection target, ClientConnection? requester, bool accepted)
    {
        if (!_invites.TryRemove(target.Id, out var requesterId) || requester?.Id != requesterId) return;
        if (!accepted || IsInDuel(target.Id) || IsInDuel(requester.Id))
        {
            _ = requester.SendAsync("pvpDeclined", new { playerId = target.Id }, CancellationToken.None);
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
        _invites.TryRemove(playerId, out _);
        foreach (var invite in _invites.Where(pair => pair.Value == playerId))
        {
            _invites.TryRemove(invite.Key, out _);
        }
    }

    private void Finish(DuelRoom duel)
    {
        _duels.TryRemove(duel.Id, out _);
        foreach (var playerId in duel.PlayerIds) _playerDuels.TryRemove(playerId, out _);
    }
}
