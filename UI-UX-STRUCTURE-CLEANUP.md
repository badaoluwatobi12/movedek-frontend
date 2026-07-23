# MoveDek UI/UX Structure Cleanup

This update standardizes the shared dashboard experience across customer, courier, merchant, and admin workspaces.

## Key improvements

- Mobile navigation closes automatically after every route change or navigation tap.
- Mobile drawer width is balanced at 86vw with a sensible maximum width.
- Header now displays the current page title, notification status, and a profile shortcut.
- Header action targets are consistently sized and accessible.
- Dashboard content uses a narrower readable maximum width and consistent responsive padding.
- Page headers support balanced title, subtitle, and action placement.
- Forms, inputs, tables, cards, loading states, and touch targets now share consistent global behavior.
- Tables remain readable on mobile through horizontal scrolling rather than crushed columns.
- Sidebar links have larger mobile-friendly targets and clearer focus states.

## Mobile drawer behavior

The drawer closes when a navigation item is tapped, the route changes programmatically, the backdrop is tapped, or the close button is used.
