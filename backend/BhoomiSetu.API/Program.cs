using System.Text;
using System.Text.Json.Serialization;
using BhoomiSetu.Application.Common.Interfaces;
using BhoomiSetu.Application.Services;
using BhoomiSetu.Infrastructure.Identity;
using BhoomiSetu.Infrastructure.Persistence;
using BhoomiSetu.Infrastructure.Seed;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerUI;

var builder = WebApplication.CreateBuilder(args);

// Add Services to Container
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BhoomiSetu API",
        Version = "v1",
        Description = "BhoomiSetu - Unified National Land Acquisition & Management Platform API.\n\n" +
                      "Provides complete REST endpoints for Multi-role Land Acquisition Workflows:\n" +
                      "- Project Agency (Proposals, DPR, Land Records, Documents)\n" +
                      "- District Admin (Field Verification, Revenue Validation, SIA, Section 4-19 Declarations)\n" +
                      "- State Admin (State Oversight, 3-Tier Approvals, Funds, Audit Logs)\n" +
                      "- Central Admin (National Monitoring, Cross-state Analytics)\n" +
                      "- Citizen / Landowners (Direct Claims, Compensation Tracking)",
        Contact = new OpenApiContact
        {
            Name = "BhoomiSetu Support",
            Email = "support@bhoomisetu.gov.in"
        }
    });

    // Configure JWT Bearer Authorization in Swagger UI
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token to authorize requests across all secure endpoints.\nExample: eyJhbGciOi..."
    });

    options.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer", doc),
            new List<string>()
        }
    });
});

// Configure EF Core with PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5432;Database=BhoomiSetu;Username=postgres;Password=root";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

// Register MediatR CQRS Services
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(LoginCommand).Assembly));

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

// Configure JWT Authentication
const string secretKey = "BhoomiSetu_National_Land_Acquisition_Management_System_Super_Secret_Key_2026";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secretKey)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

var app = builder.Build();

// Apply Database Migrations & Seed Data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        await context.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Database Migration Warning] {ex.Message}");
    }
    await DatabaseSeeder.SeedAsync(context);
}

// HTTP Pipeline Configuration - Swagger & Swagger UI
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "BhoomiSetu API v1");
    c.RoutePrefix = "swagger";
    c.DocumentTitle = "BhoomiSetu API - Swagger Documentation";
    c.DocExpansion(DocExpansion.List);
    c.EnableFilter();
    c.DisplayRequestDuration();
    c.EnablePersistAuthorization();
});

// Redirect root to Swagger UI for instant access
app.MapGet("/", () => Results.Redirect("/swagger"));

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
