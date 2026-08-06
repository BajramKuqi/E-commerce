using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options){}
    
    public DbSet<Category> Categories { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<Cart> Carts { get; set; }
    public DbSet<CartItem> CartItems { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<InventoryReservation> InventoryReservations { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<Cart>().HasIndex(c => c.UserId).IsUnique();

        modelBuilder.Entity<CartItem>().HasOne(ci => ci.Product).WithMany().OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<OrderItem>().HasOne(oi => oi.Product).WithMany().OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<InventoryReservation>().HasOne(ir => ir.Product).WithMany().OnDelete(DeleteBehavior.Restrict);
    }
}