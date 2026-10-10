import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { cssInterop } from 'nativewind';

// シートの中の入力欄。キーボードが出たときにシートが持ち上がるよう、BottomSheetTextInput を使う
// サードパーティの部品は className をそのままでは受け取れないので、NativeWind に登録する
cssInterop(BottomSheetTextInput, { className: 'style' });

export const SheetTextInput = BottomSheetTextInput;
