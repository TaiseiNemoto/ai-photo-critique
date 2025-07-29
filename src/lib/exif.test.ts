import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractExifData } from './exif';
import type { ExifData } from '@/types/upload';

// exifrライブラリをモック化
vi.mock('exifr', () => ({
  parse: vi.fn()
}));

describe('extractExifData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('正常系', () => {
    it('完全なメタデータを持つJPEGファイルからEXIFデータを抽出できる', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockExifData = {
        Make: 'Canon',
        Model: 'EOS R5',
        LensModel: 'RF24-70mm F2.8 L IS USM',
        FNumber: 2.8,
        ExposureTime: 1/250,
        ISO: 200,
        FocalLength: 35
      };

      const { parse } = await import('exifr');
      vi.mocked(parse).mockResolvedValue(mockExifData);

      const result = await extractExifData(mockFile);

      expect(result).toEqual({
        make: 'Canon',
        model: 'EOS R5',
        lensModel: 'RF24-70mm F2.8 L IS USM',
        fNumber: 'f/2.8',
        exposureTime: '1/250s',
        iso: '200',
        focalLength: '35mm'
      });
      expect(parse).toHaveBeenCalledWith(mockFile);
    });

    it('一部のフィールドが欠けている場合でも部分的なEXIFデータを抽出できる', async () => {
      const mockFile = new File([''], 'partial.jpg', { type: 'image/jpeg' });
      const mockExifData = {
        Make: 'Sony',
        Model: 'α7R V',
        ISO: 800
      };

      const { parse } = await import('exifr');
      vi.mocked(parse).mockResolvedValue(mockExifData);

      const result = await extractExifData(mockFile);

      expect(result).toEqual({
        make: 'Sony',
        model: 'α7R V',
        iso: '800'
      });
    });

    it('小数点のF値を正しく処理できる', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockExifData = {
        FNumber: 1.4
      };

      const { parse } = await import('exifr');
      vi.mocked(parse).mockResolvedValue(mockExifData);

      const result = await extractExifData(mockFile);

      expect(result.fNumber).toBe('f/1.4');
    });

    it('適切な場合にシャッター速度を分数として表示できる', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const mockExifData = {
        ExposureTime: 0.004 // 1/250
      };

      const { parse } = await import('exifr');
      vi.mocked(parse).mockResolvedValue(mockExifData);

      const result = await extractExifData(mockFile);

      expect(result.exposureTime).toBe('1/250s');
    });
  });

  describe('境界値テスト', () => {
    it('EXIFデータがないファイルを適切に処理できる', async () => {
      const mockFile = new File([''], 'noexif.jpg', { type: 'image/jpeg' });

      const { parse } = await import('exifr');
      vi.mocked(parse).mockResolvedValue(null);

      const result = await extractExifData(mockFile);

      expect(result).toEqual({});
    });

    it('空のEXIFオブジェクトを処理できる', async () => {
      const mockFile = new File([''], 'empty.jpg', { type: 'image/jpeg' });

      const { parse } = await import('exifr');
      vi.mocked(parse).mockResolvedValue({});

      const result = await extractExifData(mockFile);

      expect(result).toEqual({});
    });

    it('非常に高いISO値を処理できる', async () => {
      const mockFile = new File([''], 'highiso.jpg', { type: 'image/jpeg' });
      const mockExifData = {
        ISO: 102400
      };

      const { parse } = await import('exifr');
      vi.mocked(parse).mockResolvedValue(mockExifData);

      const result = await extractExifData(mockFile);

      expect(result.iso).toBe('102400');
    });
  });

  describe('異常系', () => {
    it('EXIF解析エラーを適切に処理できる', async () => {
      const mockFile = new File([''], 'corrupt.jpg', { type: 'image/jpeg' });

      const { parse } = await import('exifr');
      vi.mocked(parse).mockRejectedValue(new Error('Parse failed'));

      const result = await extractExifData(mockFile);

      expect(result).toEqual({});
    });

    it('サポートされていないファイル形式でエラーを投げる', async () => {
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' });

      await expect(extractExifData(mockFile))
        .rejects
        .toThrow('Unsupported file type: text/plain');
    });

    it('空のファイルでエラーを投げる', async () => {
      const mockFile = new File([''], '', { type: 'image/jpeg' });

      await expect(extractExifData(mockFile))
        .rejects
        .toThrow('Invalid file: file name is empty');
    });
  });
});