using System.Security.Cryptography;
using System.Text;
using BhoomiSetu.Application.Common.Interfaces;

namespace BhoomiSetu.Infrastructure.Identity;

public class PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16; // 128 bit
    private const int KeySize = 32;  // 256 bit
    private const int Iterations = 100000;
    private static readonly HashAlgorithmName HashAlgorithm = HashAlgorithmName.SHA256;

    public string HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(
            Encoding.UTF8.GetBytes(password),
            salt,
            Iterations,
            HashAlgorithm,
            KeySize
        );

        return $"$pbkdf2${Iterations}${Convert.ToHexString(salt)}${Convert.ToHexString(hash)}";
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(passwordHash))
        {
            return false;
        }

        // PBKDF2 Hashed Password Format: $pbkdf2$iterations$salt$hash
        if (passwordHash.StartsWith("$pbkdf2$"))
        {
            var parts = passwordHash.Split('$');
            if (parts.Length != 5) return false;

            if (!int.TryParse(parts[2], out var iterations)) return false;
            var salt = Convert.FromHexString(parts[3]);
            var expectedHash = Convert.FromHexString(parts[4]);

            var actualHash = Rfc2898DeriveBytes.Pbkdf2(
                Encoding.UTF8.GetBytes(password),
                salt,
                iterations,
                HashAlgorithm,
                expectedHash.Length
            );

            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
        }

        // Fallback for initial unhashed seed data (allows seamless auto-migration upon first login)
        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(password),
            Encoding.UTF8.GetBytes(passwordHash)
        );
    }
}
