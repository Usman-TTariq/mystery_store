interface PageHeroBannerProps {
  src: string;
  alt: string;
  /** Where to anchor the crop on small screens when banner art sits on one side */
  mobileFocus?: 'left' | 'center' | 'right';
  /** Use contain on mobile to show full banner art without cropping */
  mobileFit?: 'cover' | 'contain';
}

const mobileFocusClass = {
  left: 'object-[15%_center] sm:object-center',
  center: 'object-center',
  right: 'object-[85%_center] sm:object-center',
};

export default function PageHeroBanner({
  src,
  alt,
  mobileFocus = 'center',
  mobileFit = 'cover',
}: PageHeroBannerProps) {
  const mobileImageClass =
    mobileFit === 'contain'
      ? 'object-contain object-center p-1 sm:object-cover sm:p-0 sm:object-center'
      : `object-cover ${mobileFocusClass[mobileFocus]}`;

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-emerald-50 via-white to-emerald-50">
      <div
        className={`relative w-full sm:h-auto sm:aspect-[21/9] lg:aspect-[1728/547] sm:min-h-[220px] lg:min-h-[250px] ${
          mobileFit === 'contain' ? 'h-[210px] xs:h-[230px]' : 'h-[168px] xs:h-[188px]'
        }`}
      >
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 h-full w-full ${mobileImageClass}`}
        />
      </div>
    </div>
  );
}
