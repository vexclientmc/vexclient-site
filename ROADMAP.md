I am building Vex, a standalone Minecraft launcher/client app. Rewrite and expand the current launcher so it works like a real Minecraft launcher with Microsoft login, Modrinth mods, profiles, Minecraft installation, and launching.

IMPORTANT:
This is not a hacked client UI anymore. Remove the fake/hack-style “Modules” system completely. Replace it with a real Mods system powered by Modrinth data, but keep the Vex UI style. Do not make the UI look like a copied Modrinth page. Use Modrinth only as the data source.

AZURE / MICROSOFT LOGIN:
Use this Azure Client ID:
5cd54c95-8b6e-4e72-868b-fe7f52a12fcb

Use Microsoft Device Code Flow.

Scopes:
XboxLive.signin offline_access openid profile email

Authentication flow:

1. User clicks “Sign in with Microsoft”.
2. Launcher requests a Microsoft device code.
3. Show the user the login URL and code.
4. Poll Microsoft until login succeeds.
5. Exchange Microsoft token for Xbox Live token.
6. Exchange Xbox Live token for XSTS token.
7. Exchange XSTS token for Minecraft Services token.
8. Fetch the Minecraft profile from:
   https://api.minecraftservices.com/minecraft/profile
9. Store the Minecraft username, UUID, access token, refresh token, and expiration time locally.
10. Refresh expired tokens automatically.
11. If the Microsoft account does not own Minecraft Java Edition, show a clean error explaining that Java ownership is required.
12. Do not use a client secret.
13. Do not require the official Minecraft Launcher to be installed.

ACCOUNTS:
Add real account support:

* If no account exists, the profile/account area should say “Sign in”.
* Show the user’s Minecraft skin head icon where the current profile icon is.
* Support multiple Microsoft/Minecraft accounts.
* Support account switching.
* Support sign out.
* Save account sessions locally.
* On app open, restore the last selected account.
* Multiplayer must work when launching Minecraft, meaning Minecraft must launch with the valid authenticated Microsoft/Minecraft token, UUID, and username.

MINECRAFT LAUNCHING:
Make Vex able to launch Minecraft without the official Minecraft Launcher installed.

The launcher must:

* Download the correct Minecraft version using Mojang version manifests.
* Download the correct client jar.
* Download all required libraries.
* Download all required assets.
* Download/install the correct Java runtime if needed, or use a configured Java path.
* Build the correct launch arguments from the Minecraft version JSON.
* Pass the authenticated Minecraft username, UUID, and access token.
* Launch the correct selected profile version.
* Make multiplayer servers work normally.
* Support vanilla profiles and modded profiles.

PROFILES:
Replace the fake base profiles with real launcher profiles.

Each profile should have:

* Profile name
* Minecraft version
* Loader type: Vanilla, Fabric, Forge, Quilt, or NeoForge
* Loader version if applicable
* Game directory
* Mods list
* Memory allocation
* Java path setting
* Window size options
* Optional custom icon/color
* Last played timestamp

Users should be able to:

* Create a new profile
* Rename a profile
* Delete a profile
* Duplicate a profile
* Change Minecraft version
* Change loader
* Change memory
* Add/remove mods
* Launch that profile

If no profiles exist, show a clean empty state asking the user to sign in and create a profile.

MODRINTH MODS PANEL:
Replace the current “Modules” tab with a “Mods” tab.

Use the Modrinth API:
Search endpoint:
GET https://api.modrinth.com/v2/search

Use search facets:
[
["project_type:mod"],
["versions:<selectedMinecraftVersion>"],
["categories:<selectedLoader>"]
]

When installing a mod:

1. Search/select the Modrinth project.
2. Fetch versions from:
   GET https://api.modrinth.com/v2/project/<project_id_or_slug>/version?loaders=["<loader>"]&game_versions=["<minecraftVersion>"]&include_changelog=false
3. Pick the newest compatible release version if available.
4. If no release exists, allow beta/alpha only if the user enables that option.
5. Download the primary .jar file.
6. If no primary file exists, use the first .jar file.
7. Save the mod file into the selected profile’s mods folder.
8. Read dependencies from the version response.
9. Automatically install required dependencies if they are not already installed.
10. Do not install incompatible mods.
11. Prevent duplicate installs.
12. Validate file hashes when available.
13. Track installed mod metadata in a profile file, such as mods.json.

The Mods UI should include:

* Search bar
* Minecraft version filter based on selected profile
* Loader filter based on selected profile
* Mod cards in Vex style
* Mod icon
* Mod title
* Short description
* Author
* Downloads
* Categories
* Installed status
* Install button
* Remove button
* Update button
* Installed mods list
* Dependency install handling
* Download progress
* Error states for wrong version/loader

Do not show Modrinth branding everywhere. It should feel like the Vex launcher, just powered by Modrinth data.

SETTINGS:
Make settings actually save when the app closes and reload when the app opens.

Settings should include:

* Selected account
* Selected profile
* Theme
* Memory allocation
* Java path
* Download directory
* Close launcher after launch
* Keep launcher open after launch
* Window size
* Last selected Minecraft version
* Last selected loader
* Any Vex+ settings

Memory:

* Replace the current dropdown memory setting with a slider.
* Detect the system’s total RAM.
* Set a safe min and max based on available system memory.
* Example: minimum 1 GB, recommended 4 GB, maximum should not exceed a safe amount of system memory.
* Show the selected value clearly, such as “4 GB allocated”.

SPLASH SCREEN / BRANDING:
Fix the VEX title on the splash screen because it is currently being cropped.

Also:

* Remove the “Java Edition” text from the splash screen.
* Add custom splash text that says:
  vexclient.com
* Make the splash text a steel blue gray color.
* Keep it clean and modern.
* Make sure the VEX title fits properly at all common window sizes.

VEX+ TAB:
Add a new tab called “Vex+”.

This tab should let users buy or view premium options:

* Monthly subscription option
* One-time purchase option

Vex+ benefits:

* No ads
* More customization options
* Extra launcher themes
* Custom profile icons/colors
* Advanced modpack/profile customization
* Priority update channel
* Cloud synced profiles/settings if backend support exists later

For now, create the UI and structure for Vex+ even if payment processing is not implemented yet.
Use placeholder buttons:

* “Subscribe”
* “Buy Lifetime”
* “Restore Purchase”

Make the code ready so Stripe, Lemon Squeezy, or another payment provider can be added later.

DATA STORAGE:
Create a clean local data structure.

Suggested folders:

* accounts/
* profiles/
* instances/
* cache/
* libraries/
* assets/
* versions/
* runtimes/
* settings.json

Each profile should have its own folder:
profiles/<profile-id>/
profile.json
mods/
mods.json
saves/
config/

Make sure profiles do not overwrite each other.

GENERAL UI:
Keep the current Vex dark, modern, sleek style.
Remove fake placeholder hack-client wording.
Use real launcher wording:

* Mods
* Profiles
* Accounts
* Settings
* Launch
* Install
* Update
* Remove

Do not use:

* Modules
* ESP
* Velocity
* Fullbright
* Auto Sprint
* Hack/client module wording

ERROR HANDLING:
Add clean error messages for:

* Not signed in
* Account does not own Minecraft Java
* Microsoft auth failed
* Xbox auth failed
* XSTS failed
* Minecraft Services failed
* Version download failed
* Asset download failed
* Library download failed
* Java missing
* Mod incompatible
* Mod download failed
* Dependency install failed
* Launch failed

TESTING:
After implementation, make sure:

* A user can sign in with Microsoft.
* The Minecraft skin head appears in the account/profile area.
* Multiple accounts can be added and switched.
* Settings persist after closing and reopening the app.
* A new profile can be created.
* The correct Minecraft version installs.
* The correct loader installs.
* Compatible Modrinth mods install into the correct mods folder.
* Required mod dependencies install.
* Minecraft launches with the selected profile.
* Multiplayer works because the user is properly authenticated.
* The official Minecraft Launcher is not required.
