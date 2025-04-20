using BlazorComponents.ViewModel;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace BlazorComponents.Shared.DiagramBuider
{
    public partial class DiagramFlowBuilder
    {
        [Parameter] public RenderFragment ChildContent { get; set; } = default!;
        [Parameter] public string SubscriptionEventOnDrag { get; set; } = default!;
        [Parameter] public string ClassName { get; set; } = default!;
        [Inject] public IJSRuntime _jsRuntime { get; set; } = default!;
        private List<DiagramItemViewModel> Items { get; set; } = new List<DiagramItemViewModel>();
        private string Id { get; set; } = $"diagram-builder-{Guid.NewGuid().ToString()}";
        private DiagramItemViewModel CurrentItemOnMouse { get; set; } = default!;

        protected override void OnInitialized()
        {
            _jsRuntime.InvokeVoidAsync("diagramBuilder.init", $"#{Id}", new
            {
                SubscriptionEventOnDrag
            }, DotNetObjectReference.Create(this));
        }

        public void AddChild(DiagramItemViewModel child)
        {
            if (Items.Contains(child))
                return;

            Items.Add(child);

            StateHasChanged();
        }
        public void RemoveChild(DiagramItemViewModel child)
        {
            Items.Remove(child);

            StateHasChanged();
        }

        private void OnChangePosition((string element, string xDirection, string yDirection, bool isResizing) draggableElement, DiagramItemViewModel item)
        {
            Task.Run(() =>
            {
                _jsRuntime.InvokeVoidAsync("diagramBuilder.refreshingPosition", $"#{Id}", item.Id);
            }).ConfigureAwait(false);
        }

        private void EndRefreshingPosition((string element, string viewId) draggableElement, DiagramItemViewModel item)
        {
            Task.Run(() =>
            {
                _jsRuntime.InvokeVoidAsync("diagramBuilder.endRefreshingPosition", $"#{Id}", item.Id);
            }).ConfigureAwait(false);
        }

        private void StopDragging((string element, string viewId) payload)
        {

        }

        private void OnMouseEnter(DiagramItemViewModel item)
        {
            CurrentItemOnMouse = item;
            item.OnMouseEnter = true;

            StateHasChanged();
        }

        [JSInvokable]
        public void OutFocusItem(string itemId)
        {
            if (CurrentItemOnMouse?.Id != itemId)
                return;

            CurrentItemOnMouse.OnMouseEnter = false;

            InvokeAsync(StateHasChanged);
        }

        [JSInvokable]
        public void InFocusItem(string itemId) { }
    }
}
