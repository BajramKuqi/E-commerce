using Microsoft.AspNetCore.Identity;

namespace Ecommerce.Api.Data;

public static class RoleSeeder
{
    public static async Task SeedRolesAsync(IServiceProvider services)
    {
        var  roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        string[] roles = { "Admin", "Customer"};

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(role));

                if (!result.Succeeded)
                {
                    var errors = string.Join("; ", result.Errors.Select(x => x.Description));
                    throw new Exception($"Failed to seed role {role}: {errors}");
                }
            }
        }
    }
}