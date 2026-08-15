using Ecommerce.Api.Models.Results;
using Ecommerce.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Stripe;

namespace Ecommerce.Api.Controllers;

[ApiController]
[Route("webhooks/stripe")]
public class WebhookController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WebhookController> _logger;

    public WebhookController(IOrderService orderService, IConfiguration configuration,
        ILogger<WebhookController> logger)
    {
        _orderService = orderService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> HandleStripeEvent()
    {
        var json = await new StreamReader(Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"];
        var webhookSecret = _configuration["Stripe:WebhookSecret"];
        
        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(json, signature, webhookSecret);
        }
        catch (StripeException ex)
        {
            _logger.LogWarning("Stripe webhook signature verification failed: {Message}", ex.Message);
            return BadRequest();
        }

        switch (stripeEvent.Type)
        {
            case "payment_intent.succeeded":
            {
                if (stripeEvent.Data.Object is PaymentIntent paymentIntent)
                {
                    var result = await _orderService.MarkOrderPaidByPaymentIntentAsync(paymentIntent.Id);
                    if(result.Status == OrderStatusUpdateStatus.NotFound)
                        _logger.LogWarning("Webhook: no order found for PaymentIntent {Id}", paymentIntent.Id);
                    else if(result.Status == OrderStatusUpdateStatus.InvalidTransition)
                        _logger.LogWarning("Webhook: invalid transition for PaymentIntent {Id}", paymentIntent.Id);
                }
                break;
            }
            case "payment_intent.payment_failed":
            {
                if(stripeEvent.Data.Object is PaymentIntent failedIntent)
                   _logger.LogWarning("PaymentIntent {id} failed", failedIntent?.Id);
                break;
            }
            default:
                _logger.LogWarning("Unhandled Stripe event type {Type}", stripeEvent.Type);
                break;
        }
        return Ok();
    }
}