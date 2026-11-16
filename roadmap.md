# Roadmap

- [x] Migrate Bolt project code into Lovable (pages, styles, PDF export) and verify
- [x] Redesign login + global layout (branding config, BrandLogo, Captcha, AppHeader, AppSidebar, AppFooter) keeping auth/role logic
- [x] Refine login description and colored logos; use compact system/EMI icons in sidebar and header; verify layouts
- [ ] Open: move accounts/data to Lovable Cloud? (waiting on user decision; needs an email per account)
- [ ] Module names config (src/config/modules.ts) used app-wide; remove old short names
- [ ] Predefined units/cargos (src/config/cargos.ts) with dependent selects + suggested role; 8 mock users (Emi2026*)
- [ ] Editable role permissions matrix (superadmin only), applied to sidebar, routes ("Sin acceso"), quick cards; last-change log
- [ ] Reorganize Gestión de Usuarios: segmented tabs top-right + per-tab info strip
