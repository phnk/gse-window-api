# GSE Window API
A GNOME Shell Extension that provides a programmatic interface for listing and activating windows. This is inspired by the Win32 API that allows you to programatically change what window is active using their callback system. **This is a WIP, there are bugs**.

## Features
- **List Windows**: Enumerate all currently open windows in your GNOME Shell session, returning index, title, window class, and icon.
- **Activate by Index**: Switch to any window based on its index number returned by `List()`.

## Installation
```bash
# Clone the repository
git clone git@github.com:phnk/gse-window-api.git

# Copy to GNOME Shell extensions directory
cp -r gse-window-api ~/.local/share/gnome-shell/extensions/gse-window-api@phnk

# Restart GNOME Shell (Alt+F2, type 'r', press Enter on X11)
# Or log out and log back in on Wayland
```

## Usage
Once installed and enabled, the extension provides window management capabilities that can be accessed programmatically through GNOME Shell's extension system.

There are two functions: `List()` and `Activate(n)`. 

## Requirements
- GNOME Shell v42

## Contributing
Please feel free to submit a Pull Request.

## Author
phnk
