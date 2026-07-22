using System.Diagnostics;
using System.Globalization;

namespace server.Admin;

public sealed class ServerMetrics
{
    private readonly object _gate = new();
    private CpuSample? _previousCpuSample;

    public ServerMetricsSnapshot GetSnapshot()
    {
        var process = Process.GetCurrentProcess();
        var cpuPercent = ReadCpuPercent();
        var memory = ReadMemory();
        return new ServerMetricsSnapshot(
            cpuPercent,
            memory.TotalBytes,
            memory.AvailableBytes,
            process.WorkingSet64,
            Environment.ProcessorCount);
    }

    private double? ReadCpuPercent()
    {
        if (!OperatingSystem.IsLinux()) return null;
        try
        {
            var values = File.ReadLines("/proc/stat").First().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (values.Length < 5 || values[0] != "cpu") return null;
            var fields = values.Skip(1).Select(value => long.Parse(value, CultureInfo.InvariantCulture)).ToArray();
            var total = fields.Sum();
            var idle = fields[3] + (fields.Length > 4 ? fields[4] : 0);
            lock (_gate)
            {
                var current = new CpuSample(total, idle);
                var previous = _previousCpuSample;
                _previousCpuSample = current;
                if (previous is null || total <= previous.Total) return null;
                return Math.Round(100d * (1d - (double)(idle - previous.Idle) / (total - previous.Total)), 1);
            }
        }
        catch (IOException) { return null; }
        catch (UnauthorizedAccessException) { return null; }
        catch (FormatException) { return null; }
    }

    private static (long? TotalBytes, long? AvailableBytes) ReadMemory()
    {
        if (!OperatingSystem.IsLinux()) return (null, null);
        try
        {
            var fields = File.ReadLines("/proc/meminfo")
                .Select(line => line.Split(':', 2))
                .Where(parts => parts.Length == 2)
                .ToDictionary(parts => parts[0], parts => parts[1].Trim(), StringComparer.Ordinal);
            return (ReadKilobytes(fields, "MemTotal"), ReadKilobytes(fields, "MemAvailable"));
        }
        catch (IOException) { return (null, null); }
        catch (UnauthorizedAccessException) { return (null, null); }
    }

    private static long? ReadKilobytes(IReadOnlyDictionary<string, string> values, string key)
    {
        if (!values.TryGetValue(key, out var value)) return null;
        var number = value.Split(' ', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault();
        return long.TryParse(number, CultureInfo.InvariantCulture, out var kilobytes) ? kilobytes * 1024 : null;
    }

    private sealed record CpuSample(long Total, long Idle);
}

public sealed record ServerMetricsSnapshot(double? CpuPercent, long? TotalMemoryBytes, long? AvailableMemoryBytes, long ProcessMemoryBytes, int CpuCores);
