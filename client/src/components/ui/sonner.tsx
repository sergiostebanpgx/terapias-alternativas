import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      closeButton
      richColors
      position="top-right"
      theme="dark"
      {...props}
    />
  );
};

export { Toaster };
