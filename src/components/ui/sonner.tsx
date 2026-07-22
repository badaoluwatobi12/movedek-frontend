import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

 type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      richColors
      closeButton
      expand
      visibleToasts={4}
      duration={5000}
      gap={10}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast !rounded-2xl !border-border/80 !bg-card !px-4 !py-3 !text-foreground !shadow-xl",
          title: "!text-sm !font-semibold !leading-5",
          description: "!text-sm !leading-5 !text-muted-foreground",
          actionButton:
            "!rounded-lg !bg-primary !px-3 !text-primary-foreground",
          cancelButton: "!rounded-lg !bg-muted !px-3 !text-foreground",
          closeButton:
            "!border-border !bg-card !text-muted-foreground hover:!text-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
