import vetmartLogoUrl from '../../assets/logo.png';

type VetMartLogoProps = {
  className?: string;
};

function VetMartLogo({ className = 'h-8 w-8' }: VetMartLogoProps) {
  return (
    <img src={vetmartLogoUrl} alt="BagherHat Poultry logo" className={`shrink-0 rounded-md ${className}`} />
  );
}

export default VetMartLogo;
