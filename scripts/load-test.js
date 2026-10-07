const http = require('http');
const readline = require('readline');
const autocannon = require('autocannon');
const { spawn } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (query) => new Promise((resolve) => {
  if (!rl || rl.closed) return resolve('');
  try {
    rl.question(query, (ans) => resolve(ans || ''));
  } catch {
    resolve('');
  }
});

function checkServer(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.get({
        hostname: u.hostname,
        port: u.port || 80,
        path: u.pathname || '/',
        timeout: 2000
      }, () => resolve(true));
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

async function main() {
  console.log('\n====================================================================');
  console.log('       أداة اختبار ضغط وتحمل الموقع (Stress & Load Testing)');
  console.log('              منصة رأس غارب - فحص سعة وقوة السيرفر');
  console.log('====================================================================\n');

  let defaultUrl = 'http://localhost:3000';
  let targetUrl = (await ask(`[1] رابط الموقع المراد اختباره (اضغط Enter للافتراضي: ${defaultUrl}): `)).trim();
  if (!targetUrl) targetUrl = defaultUrl;
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'http://' + targetUrl;
  }

  // Check if target is localhost and running
  if (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
    process.stdout.write('\n⏳ جاري التحقق من تشغيل السيرفر المحلي... ');
    const isRunning = await checkServer(targetUrl);
    if (isRunning) {
      console.log('✅ السيرفر يعمل وجاهز.');
    } else {
      console.log('\n⚠️ السيرفر غير مشغل حالياً. جاري تشغيله تلقائياً في الخلفية...');
      const serverProcess = spawn('node', ['server.js'], {
        detached: true,
        stdio: 'ignore'
      });
      serverProcess.unref();

      // Wait for server to come up
      let retries = 10;
      let up = false;
      while (retries > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        up = await checkServer(targetUrl);
        if (up) break;
        retries--;
      }
      if (up) {
        console.log('✅ تم تشغيل السيرفر بنجاح!');
      } else {
        console.log('⚠️ لم نتمكن من التأكد من استجابة السيرفر، سنتابع الاختبار على أي حال.');
      }
    }
  }

  console.log('\n[2] اختر عدد المستخدمين المتزامنين في نفس اللحظة (Concurrent Users):');
  console.log('    1) 50 مستخدم متزامن (فحص أولي خفيف)');
  console.log('    2) 200 مستخدم متزامن (ضغط معتاد)');
  console.log('    3) 500 مستخدم متزامن (ضغط عالي)');
  console.log('    4) 1,000 مستخدم متزامن (أقصى اختبار تحمل - Stress Test)');
  console.log('    5) تحديد رقم مخصص');
  
  const choice = (await ask('\nاختر الرقم (1-5) [افتراضي 2]: ')).trim() || '2';
  let connections = 200;
  if (choice === '1') connections = 50;
  else if (choice === '3') connections = 500;
  else if (choice === '4') connections = 1000;
  else if (choice === '5') {
    const custom = (await ask('أدخل عدد المستخدمين المتزامنين: ')).trim();
    connections = parseInt(custom, 10) || 200;
  }

  const durationStr = (await ask('\n[3] مدة الاختبار بالثواني [اضغط Enter للافتراضي 10 ثوانٍ]: ')).trim();
  const duration = parseInt(durationStr, 10) || 10;

  console.log('\n====================================================================');
  console.log(`🚀 بدء الاختبار الآن:`);
  console.log(`   - الرابط المستهدف: ${targetUrl}`);
  console.log(`   - المستخدمين في اللحظة: ${connections}`);
  console.log(`   - مدة الاختبار: ${duration} ثانية`);
  console.log('====================================================================\n');
  console.log('⏳ جاري إرسال الطلبات المكثفة ومحاكاة الضغط... يرجى الانتظار...\n');

  rl.close();

  const instance = autocannon({
    url: targetUrl,
    connections: connections,
    duration: duration,
    renderStatusCodes: true
  }, (err, result) => {
    if (err) {
      console.error('❌ حدث خطأ أثناء الاختبار:', err);
      return;
    }
    printResults(result, connections);
  });

  autocannon.track(instance, { renderProgressBar: true });
}

function printResults(res, connections) {
  console.log('\n\n====================================================================');
  console.log('                      📊 تقرير نتائج الفحص');
  console.log('====================================================================');

  const totalRequests = res.requests.total || 0;
  const reqPerSec = Math.round(res.requests.average || 0);
  const avgLatency = Math.round(res.latency.average || 0);
  const minLatency = Math.round(res.latency.min || 0);
  const maxLatency = Math.round(res.latency.max || 0);
  const p99Latency = Math.round(res.latency.p99 || 0);
  const errors = (res.errors || 0) + (res.timeouts || 0) + (res.non2xx || 0);

  console.log(`🔹 إجمالي الطلبات التي تمت معالجتها: ${totalRequests.toLocaleString()} طلب`);
  console.log(`🔹 معدل الطلبات في الثانية (Requests/Sec): ${reqPerSec.toLocaleString()} طلب/ث`);
  console.log(`🔹 متوسط زمن الاستجابة (Latency Avg): ${avgLatency} مللي ثانية (ms)`);
  console.log(`🔹 أسرع استجابة: ${minLatency}ms | أبطأ استجابة: ${maxLatency}ms | 99% من الطلبات تحت: ${p99Latency}ms`);
  console.log(`🔹 الأخطاء والتجاوزات (Timeouts / Errors): ${errors}`);

  console.log('\n--------------------------------------------------------------------');
  console.log('                   💡 تقييم حالة الموقع والسيرفر:');
  console.log('--------------------------------------------------------------------');

  if (errors === 0 && avgLatency < 150) {
    console.log(`✅ نتيجة ممتازة جداً (خارقة):`);
    console.log(`   موقعك تحمّل ${connections} مستخدم في نفس اللحظة بدون أي خطأ مع سرعة استجابة فائقة!`);
  } else if (errors === 0 && avgLatency <= 1000) {
    console.log(`🟢 نتيجة جيدة جداً (مستقر):`);
    console.log(`   الموقع صامد وتحمّل ${connections} مستخدم متزامن، وسرعة الاستجابة مقبولة وطبيعية.`);
  } else if (errors === 0 && avgLatency > 1000) {
    console.log(`⚠️ تنبيه (بطء تحت الضغط):`);
    console.log(`   الموقع لم يقع، لكن زمن الاستجابة ارتفع (${avgLatency}ms) مما يشير إلى أن السيرفر يقترب من حدوده.`);
  } else {
    console.log(`❌ نقطة الانهيار (Breaking Point):`);
    console.log(`   حدثت أخطاء أو Timeouts (${errors}) عند تشغيل ${connections} مستخدم متزامن.`);
    console.log(`   هذا يعني أن الحد الأقصى الحالي لتحمل موقعك يقع قبل هذا الرقم.`);
  }

  console.log('====================================================================\n');
}

main().catch(console.error);
