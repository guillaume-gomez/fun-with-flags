import { useState } from "react";
import { useCopyToClipboard } from 'usehooks-ts';

interface CopyToClipboardButtonProps {
  initialLabel: string;
} 

function CopyToClipboardButton({initialLabel} : CopyToClipboardButtonProps) {
  const [copiedText, copy] = useCopyToClipboard();
  const [label, setLabel] = useState<string>(initialLabel);

  function handleCopy(text: string) {
    copy(text)
      .then(() => {
        console.log('Copied!', { text })
        setLabel("Copied to clipboard !");
        setTimeout(() => {
          setLabel(initialLabel);
        }, 2500);
      })
      .catch(error => {
        console.error('Failed to copy!', error)
      })
  }

  return (
    <button 
      className="btn btn-primary"
      onClick={() => handleCopy(document.location.href) }
    >
      {label}
    </button>
   );

}

export default CopyToClipboardButton;