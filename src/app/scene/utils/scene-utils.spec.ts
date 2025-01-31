import { SceneUtils } from './scene-utils';

describe('SceneUtils', () => {

   const tableData = [
      ['1', 'X', 'true'],
      ['2', 'Y', 'false'],
      ['3', 'Z', 'true']
   ];

   it('#entriesFromTableData should return entries with keys derived from given column names', () => {

      // when
      const entries = SceneUtils.entriesFromTableData({ columnNames: ['A', 'B', 'C'], tableData: tableData });

      // then
      const expected = [
         { A: '1', B: 'X', C: 'true' },
         { A: '2', B: 'Y', C: 'false' },
         { A: '3', B: 'Z', C: 'true' }
      ];
      expect(entries).toEqual(expected);
   });

   it('#entriesFromTableData should return entries with generated keys', () => {

      // when
      const entries = SceneUtils.entriesFromTableData({ tableData: tableData });

      // then
      const expected = [
         { 'Column 1': '1', 'Column 2': 'X', 'Column 3': 'true' },
         { 'Column 1': '2', 'Column 2': 'Y', 'Column 3': 'false' },
         { 'Column 1': '3', 'Column 2': 'Z', 'Column 3': 'true' }
      ];
      expect(entries).toEqual(expected);
   });

   it('#entriesFromTableData should return entries with generated and derived keys', () => {

      // when
      const entries = SceneUtils.entriesFromTableData({ columnNames: ['', 'B', ''], tableData: tableData });

      // then
      const expected = [
         { 'Column 1': '1', B: 'X', 'Column 3': 'true' },
         { 'Column 1': '2', B: 'Y', 'Column 3': 'false' },
         { 'Column 1': '3', B: 'Z', 'Column 3': 'true' }
      ];
      expect(entries).toEqual(expected);
   });

   it('#fileContextInfo should return entries with generated keys', () => {

      // when
      const contextInfo = SceneUtils.fileContextInfo(createFile());

      // then
      expect(contextInfo.length).toBe(3);
      expect(contextInfo[0]).toEqual({ name: 'File Name', value: 'test.txt'});
      expect(contextInfo[1]).toEqual({ name: 'File Type', value: 'text/plain'});
      expect(contextInfo[2].name).toEqual('File Modification Time');
   });

   function createFile(): File {
      return new File(['this is the content'], 'test.txt', { type: 'text/plain' });
   }
});
