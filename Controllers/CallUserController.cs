using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Azure.Communication.Identity;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Azure.Communication.CallingServer;
using System.Collections.Generic;
using Azure.Communication;

namespace my_new_app.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class CallUserController : ControllerBase
    {
        private readonly ILogger<CallUserController> _logger;
        private IConfiguration _config;

        public CallUserController(IConfiguration config, ILogger<CallUserController> logger)
        {
            _logger = logger;
            _config = config;
        }

        [HttpGet]
        public async Task Get([FromQuery] string id)
        {
            String connectionString = _config.GetValue<string>("ResourceConnectionString");
            var client = new CommunicationIdentityClient(connectionString);

            var communicationUserIdentifierResponse = await client.CreateUserAsync();
            var user =  communicationUserIdentifierResponse.Value;

            var baseUrl = Request.Host.ToString(); // || "https://e970-2001-569-7c3a-8700-7cd8-3eab-7510-427d.ngrok.io";
            Console.WriteLine("Request Host = "+Request.Scheme + "://"+baseUrl);

            var callbackUri = baseUrl+"/callback";
            var uri = new Uri(baseUrl+"/MyStaticFiles/test1.wav");
            
            var createCallOption = new CreateCallOptions(
            new Uri(callbackUri),
            new[] { MediaType.Audio },
            new[]
            {
                EventSubscriptionType.ParticipantsUpdated,
                EventSubscriptionType.DtmfReceived
            });

            var targetUser = new CommunicationUserIdentifier(id);

            var callingServerClient = new CallingServerClient(connectionString);

            var callConnection = await callingServerClient.CreateCallConnectionAsync(
                user,
                new List<CommunicationUserIdentifier>() {targetUser},
                createCallOption
            );

            var actualCallConnection = callConnection.Value;

            System.Console.WriteLine("Going to wait 30 seconds to wait for the call");

            System.Threading.Thread.Sleep(15000);
            System.Console.WriteLine("Playing audio from uri = "+uri.ToString());

            var playAudioRequest = new PlayAudioOptions()
            {
                AudioFileUri = uri,
                OperationContext = Guid.NewGuid().ToString(),
                Loop = true,
            };

             var response = await actualCallConnection.PlayAudioAsync(playAudioRequest).ConfigureAwait(false);

            System.Console.WriteLine($"PlayAudioAsync response --> {response.GetRawResponse()}, Id: {response.Value.OperationId}, Status: {response.Value.Status}, OperationContext: {response.Value.OperationContext}, ResultInfo: {response.Value.ResultInfo}");
                
        }
    }
}
