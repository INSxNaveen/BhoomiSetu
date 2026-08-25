namespace BhoomiSetu.Domain.Common;

public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
}

public abstract class AuditableEntity : BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; } = false;
}

public class Result
{
    public bool IsSuccess { get; }
    public string Message { get; }
    public List<string> Errors { get; }

    protected Result(bool isSuccess, string message, List<string>? errors = null)
    {
        IsSuccess = isSuccess;
        Message = message;
        Errors = errors ?? new List<string>();
    }

    public static Result Success(string message = "Operation completed successfully.") => new(true, message);
    public static Result Failure(string message, List<string>? errors = null) => new(false, message, errors);
    public static Result<T> Success<T>(T data, string message = "Success") => Result<T>.Success(data, message);
    public static Result<T> Failure<T>(string message, List<string>? errors = null) => Result<T>.Failure(message, errors);
}

public class Result<T> : Result
{
    public T? Data { get; }

    private Result(bool isSuccess, T? data, string message, List<string>? errors = null)
        : base(isSuccess, message, errors)
    {
        Data = data;
    }

    public static Result<T> Success(T data, string message = "Success") => new(true, data, message);
    public new static Result<T> Failure(string message, List<string>? errors = null) => new(false, default, message, errors);
}
