import { Theme } from './settings/types';
import { SCenterDigitalChessboardComponentPlan } from './components/generated/SCenterDigitalChessboardComponentPlan';

let theme: Theme = 'light';

function App() {
  function setTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  setTheme(theme);

  return (
    <>
      <SCenterDigitalChessboardComponentPlan />
    </>
  ); // %EXPORT_STATEMENT%
}

export default App;
