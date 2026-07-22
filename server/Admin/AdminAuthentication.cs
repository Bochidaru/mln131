using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace server.Admin;

public static class AdminAuthentication
{
    public static bool IsAuthorized(HttpContext context, IOptions<AdminOptions> options)
    {
        if (!context.Request.Headers.Authorization.ToString().StartsWith("Basic ", StringComparison.OrdinalIgnoreCase))
        {
            Challenge(context);
            return false;
        }

        try
        {
            var encoded = context.Request.Headers.Authorization.ToString()[6..].Trim();
            var credentials = Encoding.UTF8.GetString(Convert.FromBase64String(encoded)).Split(':', 2);
            var configured = options.Value;
            if (credentials.Length == 2
                && FixedTimeEquals(credentials[0], configured.Username)
                && FixedTimeEquals(credentials[1], configured.Password)) return true;
        }
        catch (FormatException) { }

        Challenge(context);
        return false;
    }

    private static bool FixedTimeEquals(string left, string right) =>
        CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(left), Encoding.UTF8.GetBytes(right));

    private static void Challenge(HttpContext context) =>
        context.Response.Headers.WWWAuthenticate = "Basic realm=\"MLN131 Admin\", charset=\"UTF-8\"";
}
