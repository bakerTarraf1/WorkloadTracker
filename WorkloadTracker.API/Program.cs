using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WorkloadTracker.API.Data;
using WorkloadTracker.API.Models;
using WorkloadTracker.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Identity
builder.Services.AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>()
    .AddDefaultTokenProviders();

// Password Policy
builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
});

// JWT
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddAuthorization();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
    
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<NotificationService>(); 
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<DailyStandupService>();
builder.Services.AddHttpClient();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "WorkloadTracker API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Example: 'Bearer {token}'",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Seed
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    string[] roles = { "Admin", "TeamLeader", "Member" };
    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

    var adminEmail = "admin@workload.com";
    if (await userManager.FindByEmailAsync(adminEmail) == null)
    {
        var adminUser = new User
        {
            UserName = adminEmail,
            Email = adminEmail,
            FullName = "Admin User"
        };
        await userManager.CreateAsync(adminUser, "Admin@123");
        await userManager.AddToRoleAsync(adminUser, "Admin");
    }

    var leaderEmail = "leader@workload.com";
    if (await userManager.FindByEmailAsync(leaderEmail) == null)
    {
        var leaderUser = new User
        {
            UserName = leaderEmail,
            Email = leaderEmail,
            FullName = "Team Leader"
        };
        await userManager.CreateAsync(leaderUser, "Leader@123");
        await userManager.AddToRoleAsync(leaderUser, "TeamLeader");
    }

    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (!await dbContext.WeightMultipliers.AnyAsync())
    {
        dbContext.WeightMultipliers.AddRange(
            new WeightMultiplier { Type = "Complexity", Name = "Simple", Multiplier = 1.0 },
            new WeightMultiplier { Type = "Complexity", Name = "Medium", Multiplier = 1.5 },
            new WeightMultiplier { Type = "Complexity", Name = "Complex", Multiplier = 2.0 },
            new WeightMultiplier { Type = "Priority", Name = "Low", Multiplier = 1.0 },
            new WeightMultiplier { Type = "Priority", Name = "Medium", Multiplier = 1.2 },
            new WeightMultiplier { Type = "Priority", Name = "High", Multiplier = 1.5 },
            new WeightMultiplier { Type = "Priority", Name = "Critical", Multiplier = 2.0 }
        );
        await dbContext.SaveChangesAsync();
    }
}

app.Run();