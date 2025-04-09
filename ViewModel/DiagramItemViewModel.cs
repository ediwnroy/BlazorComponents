using Microsoft.AspNetCore.Components;

namespace BlazorComponents.ViewModel
{
    public class DiagramItemViewModel
    {
        public DiagramItemViewModel()
        {
            Id = Guid.NewGuid().ToString();
        }

        public string Id { get; set; } = default!;
        public string Title { get; set; } = default!;
        public string Icon { get; set; } = default!;
        public string Class { get; set; } = default!;
        public bool OnMouseEnter { get; set; } = default!;
        public double X { get; set; } = default!;
        public double Y { get; set; } = default!;
        public List<FlowConnectors> Connectors { get; set; } = default!;
        public RenderFragment Content { get; set; } = default!;
    }

    public class FlowConnectors
    {
        public string ItemId { get; set; } = default!;
        public int SortOrder { get; set; }
        public bool Input { get; set; }
    }
}
