using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Azure.Communication.Identity;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Azure.Communication.CallingServer;
using Microsoft.IdentityModel.Tokens;

namespace my_new_app.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class AddUserController : ControllerBase
    {
        private readonly ILogger<AddUserController> _logger;
        private IConfiguration _config;

        public AddUserController(IConfiguration config, ILogger<AddUserController> logger)
        {
            _logger = logger;
            _config = config;
        }

        [HttpGet]
        public async Task Get([FromQuery] string serverCallId)
        {
            var connectionString = _config.GetValue<string>("ResourceConnectionString");
            var client = new CommunicationIdentityClient(connectionString);

            // user added and removed from the call
            var communicationUserIdentifierResponse = await client.CreateUserAsync();
            var user =  communicationUserIdentifierResponse.Value;

            serverCallId = "5013c8f1-fd98-44d9-9f0a-ebbb5790b253";
            var baseUrl = Request.Host.ToString(); // "https://e970-2001-569-7c3a-8700-7cd8-3eab-7510-427d.ngrok.io";
            Console.WriteLine("Request Host = "+Request.Protocol + "://"+baseUrl);
            
            var callingServerClient = new CallingServerClient(connectionString);
            var callbackUrl = new Uri(baseUrl +"/api/CallbackTest");

            var mediaTypes = new[] {MediaType.Audio};
            var eventSubscriptionTypes = new[] { EventSubscriptionType.ParticipantsUpdated };
            var uri = new Uri(baseUrl+"/MyStaticFiles/test1.wav");

            var joinCallOptions = new JoinCallOptions(callbackUrl, mediaTypes, eventSubscriptionTypes);
            try { 
                
                var serverCall = callingServerClient.InitializeServerCall(serverCallId);
                try {
                    System.Threading.Thread.Sleep(5000);
                    var result = await serverCall.PlayAudioAsync(uri, Guid.NewGuid().ToString(), callbackUrl);
                }
                catch(Exception ex) {
                    System.Console.WriteLine("trying to play audio from server call "+ex.ToString());
                }
                var callConnectionResponse = await callingServerClient.JoinCallAsync(serverCallId, user, joinCallOptions);
                var callConnection = callConnectionResponse.Value;

                Console.WriteLine("My call connection id for group call ("+serverCallId.ToString() +")= " +callConnection.CallConnectionId);
                Console.WriteLine("Added User1 "+user.Id);

                try {
                    System.Threading.Thread.Sleep(30000);
                    System.Console.WriteLine("Playing audio from uri = "+uri.ToString());

                    var playAudioRequest = new PlayAudioOptions()
                    {
                        AudioFileUri = uri,
                        OperationContext = Guid.NewGuid().ToString(),
                        Loop = true,
                    };

                    var response = await callConnection.PlayAudioAsync(playAudioRequest).ConfigureAwait(false);

                   System.Console.WriteLine($"PlayAudioAsync response --> {response.GetRawResponse()}, Id: {response.Value.OperationId}, Status: {response.Value.Status}, OperationContext: {response.Value.OperationContext}, ResultInfo: {response.Value.ResultInfo}");

                    System.Threading.Thread.Sleep(5000);
                }
                catch(Exception ex) {
                    System.Console.WriteLine(ex.ToString());
                }
                
                System.Threading.Thread.Sleep(5000);

                await callConnection.HangupAsync();
                Console.WriteLine("Removed User "+user.Id);
               System.Console.WriteLine("done");
            }
            catch(Exception ex) {
                Console.WriteLine(ex.ToString());
            }
        }
    }
}
