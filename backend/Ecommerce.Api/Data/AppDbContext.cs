using Ecommerce.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, IdentityRole, string>
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
        
        modelBuilder.Entity<Order>().HasOne(o => o.User).WithMany(u => u.Orders).OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<Cart>().HasOne(c => c.User).WithOne(u => u.Cart).HasForeignKey<Cart>(c => c.UserId).OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Product>().Property(p => p.Price).HasPrecision(18, 2);
        
        modelBuilder.Entity<Order>().Property(o => o.TotalAmount).HasPrecision(18, 2);
        
        modelBuilder.Entity<OrderItem>().Property(oi => oi.UnitPriceSnapshot).HasPrecision(18, 2);
        
        modelBuilder.Entity<Product>().HasOne(p => p.Category).WithMany(c => c.Products).OnDelete(DeleteBehavior.Restrict);
    }
}