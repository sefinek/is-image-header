declare function isImage(url: string): Promise<isImage.Result>;

declare namespace isImage {
    interface Result {
        success: boolean;
        status: number | null;
        isImage: boolean | null;
        message?: string;
    }
}

export = isImage;
