#!/usr/bin/env python3
"""
Main CLI entry point for FortifyJS CLI
"""

import os
import sys
import click
from rich.console import Console
from rich.theme import Theme
from rich.traceback import install as install_rich_traceback

from fortifyjs_cli import __version__
from fortifyjs_cli.commands.keys import keys_group
from fortifyjs_cli.commands.hash import hash_group
from fortifyjs_cli.commands.encrypt import encrypt_group
from fortifyjs_cli.commands.decrypt import decrypt_group
from fortifyjs_cli.commands.tokens import tokens_group
from fortifyjs_cli.commands.audit import audit_group
from fortifyjs_cli.commands.memory_hard import memory_hard_group
from fortifyjs_cli.commands.post_quantum import post_quantum_group
from fortifyjs_cli.config import load_config, get_config_path
from fortifyjs_cli.utils.logging import setup_logging

# Set up rich console with custom theme
custom_theme = Theme({
    "info": "cyan",
    "warning": "yellow",
    "error": "bold red",
    "success": "bold green",
    "command": "bold blue",
    "param": "bold cyan",
    "value": "green",
    "path": "yellow",
})

console = Console(theme=custom_theme)
install_rich_traceback(console=console)

# Create the main CLI group
@click.group(context_settings={"help_option_names": ["-h", "--help"]})
@click.version_option(__version__, "-v", "--version", prog_name="FortifyJS CLI")
@click.option("--config", "-c", type=click.Path(exists=True), help="Path to config file")
@click.option("--verbose", "-V", is_flag=True, help="Enable verbose output")
@click.option("--quiet", "-q", is_flag=True, help="Suppress all output except errors")
@click.option("--no-color", is_flag=True, help="Disable colored output")
@click.option("--library-path", "-l", type=click.Path(exists=True), help="Path to the FortifyJS library")
@click.pass_context
def cli(ctx, config, verbose, quiet, no_color, library_path):
    """FortifyJS CLI - Command-line interface for the FortifyJS security library.

    This CLI provides developers with easy access to advanced cryptographic and security
    functions from the FortifyJS library.
    """
    # Initialize context object
    ctx.ensure_object(dict)

    # Load configuration
    if config:
        config_path = config
    else:
        config_path = get_config_path()

    ctx.obj["config"] = load_config(config_path)
    ctx.obj["verbose"] = verbose
    ctx.obj["quiet"] = quiet
    ctx.obj["no_color"] = no_color
    ctx.obj["console"] = console
    ctx.obj["library_path"] = library_path

    # Set up logging
    log_level = "DEBUG" if verbose else "INFO"
    if quiet:
        log_level = "ERROR"

    setup_logging(log_level, no_color)

    # Display header in verbose mode
    if verbose and not quiet:
        console.print(f"[bold]FortifyJS CLI v{__version__}[/bold]")
        console.print(f"Using configuration from: [path]{config_path}[/path]")
        if library_path:
            console.print(f"Using FortifyJS library from: [path]{library_path}[/path]")

# Add command groups
cli.add_command(keys_group)
cli.add_command(hash_group)
cli.add_command(encrypt_group)
cli.add_command(decrypt_group)
cli.add_command(tokens_group)
cli.add_command(audit_group)
cli.add_command(memory_hard_group)
cli.add_command(post_quantum_group)

# Main entry point
def main():
    try:
        cli(prog_name="fortify")
    except Exception as e:
        console.print(f"[error]Error: {str(e)}[/error]")
        if "--verbose" in sys.argv or "-V" in sys.argv:
            console.print_exception()
        sys.exit(1)

if __name__ == "__main__":
    main()
