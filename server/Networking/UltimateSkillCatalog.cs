namespace server.Networking;

public static class UltimateSkillCatalog
{
    public const string DefaultSkillId = "momentum";
    public const int SkillPrice = 20;

    public static readonly HashSet<string> AllSkillIds = new(StringComparer.Ordinal)
    {
        DefaultSkillId,
        "veil",
        "blink",
        "overdrive",
        "feather",
        "rewind",
    };

    public static bool IsPurchasable(string skillId) => skillId != DefaultSkillId && AllSkillIds.Contains(skillId);
}
