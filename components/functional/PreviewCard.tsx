type PreviewCardProps = {
    url: string;
    title?: string;
};

export default function PreviewCard({ url, title }: PreviewCardProps) {

    function validateIframe() {

    }
    return (
        <div className="preview-card">
            <a href={url}>{title ?? url}</a>
            <div className="preview-card__box">
                <iframe
                    src={url}
                    title={title ?? `Preview of ${url}`}
                    width={500}
                    height={500}
                    onLoad={validateIframe}
                />
            </div>
        </div>
    );
}
