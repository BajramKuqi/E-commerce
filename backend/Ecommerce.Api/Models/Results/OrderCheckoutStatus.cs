namespace Ecommerce.Api.Models.Results;

public enum OrderCheckoutStatus
{
    Success,
    CartEmpty,
    InsufficientStock,
    ConcurrencyConflict
}