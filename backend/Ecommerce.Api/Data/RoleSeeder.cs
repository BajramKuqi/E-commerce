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
            if(!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new IdentityRole(role));
        }
    }
}