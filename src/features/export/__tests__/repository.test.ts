import { listExportRows } from '../repository';

describe('listExportRows', () => {
  it('選択カテゴリが無い（空の範囲）は DB を見ずに空配列', async () => {
    await expect(listExportRows(null)).resolves.toEqual([]);
  });
});
