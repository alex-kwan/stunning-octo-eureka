using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Azure.Communication.Identity;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

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
        public async Task<Object> Get()
        {
            string connectionString = _config.GetValue<string>("ResourceConnectionString");
            
            System.Console.WriteLine("My connection string is "+connectionString);

            var client = new CommunicationIdentityClient(connectionString);

            var tokenResponse = await client.CreateUserAndTokenAsync(scopes: new [] { CommunicationTokenScope.VoIP });
            var token =  tokenResponse.Value.AccessToken.Token;
            var expiresOn = tokenResponse.Value.AccessToken.ExpiresOn;
            var user = tokenResponse.Value.User;
            Console.WriteLine($"\nIssued an access token with 'voip' scope that expires at {expiresOn}:");
            Console.WriteLine(token);
            
            return new {
                token,
                expiresOn,
                user
            };
        }
    }
}
