using BhoomiSetu.Domain.Common;

namespace BhoomiSetu.Domain.Geography;

public class State : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<District> Districts { get; set; } = new List<District>();
}

public class District : BaseEntity
{
    public Guid StateId { get; set; }
    public State State { get; set; } = null!;
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<Tehsil> Tehsils { get; set; } = new List<Tehsil>();
}

public class Tehsil : BaseEntity
{
    public Guid DistrictId { get; set; }
    public District District { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public ICollection<Village> Villages { get; set; } = new List<Village>();
}

public class Village : BaseEntity
{
    public Guid TehsilId { get; set; }
    public Tehsil Tehsil { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
}
