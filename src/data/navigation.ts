export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export const mainNavItems: NavItem[] = [
  { id: "nav-home", label: "Home", href: "/" },
  { id: "nav-about", label: "About", href: "/about" },
  { id: "nav-courses", label: "Courses", href: "/courses" },
  { id: "nav-products", label: "Shop", href: "/products" },
  { id: "nav-contact", label: "Contact", href: "/contact" },
  { id: "nav-blog", label: "Blog", href: "/blog" },
];
