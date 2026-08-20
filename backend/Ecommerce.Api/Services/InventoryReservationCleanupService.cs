using Ecommerce.Api.Data;
using Ecommerce.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Ecommerce.Api.Services;

public class InventoryReservationCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _serviceScopeFactory;
    private readonly ILogger<InventoryReservationCleanupService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromMinutes(1);

    public InventoryReservationCleanupService(IServiceScopeFactory serviceScopeFactory,
        ILogger<InventoryReservationCleanupService> logger)
    {
        _serviceScopeFactory = serviceScopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_interval);
        do
        {
            try
            {
                await ProcessExpiredReservationAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while processing expired reservation");
            }
        }
        while(await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task ProcessExpiredReservationAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceScopeFactory.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        
        var now = DateTime.UtcNow;

        var expiredReservations = await context.InventoryReservations.Include(r => r.Order)
            .Include(r => r.Product).Where(r => r.ExpiresAt <= now && r.OrderId != null)
            .ToListAsync(cancellationToken);
        
        if(expiredReservations.Count == 0)
            return;

        int released = 0;
        int discarded = 0;

        foreach (var reservation in expiredReservations)
        {
            if (reservation.Order == null)
            {
                context.InventoryReservations.Remove(reservation);
                discarded++;
                continue;
            }

            if (reservation.Order.Status == OrderStatus.Pending)
            {
                reservation.Product.StockQuantity += reservation.Quantity;
                reservation.Order.Status = OrderStatus.Cancelled;
                released++;
            }
            else
            {
                discarded++;
            }

            context.InventoryReservations.Remove(reservation);
        }

        try
        {
            await context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation(
                "Reservation cleanup: {Released} orders cancelled and restocked, {Discarded} stale reservation discarded",
                released, discarded);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(ex, "Concurrency conflict during reservation cleanup");
        }
    }
}